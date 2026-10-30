"""Load production contract; mock only GenVM I/O and storage.
Unit tests do not establish live validator consensus. See the on-chain receipts.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
from types import ModuleType, SimpleNamespace
import unittest


class Runtime:
    def __init__(self):
        self.pages = {
            'https://fixture.test/preprint': 'Synthetic structural benchmark. Target RMSD <= 1.26 Angstrom and compute reduction >= 38%.',
            'https://fixture.test/replication': '{"rmsd":1.21,"compute_reduction_pct":40.9,"fixture":true}',
        }
        self.verdict = 'REPLICATED_WITHIN_TOLERANCE'
        self.baseline_override = None
        self.audit_override = None
        self.status = 200
        self.calls = []

    def get(self, url):
        self.calls.append(('web', url))
        return SimpleNamespace(status=self.status, body=self.pages[url].encode())

    def strict_eq(self, fn):
        self.calls.append(('strict_eq', None))
        return fn()

    def non_comparative(self, fn, *, task, criteria):
        source = fn()
        assert 'Synthetic structural benchmark' in source
        assert 'grounded' in criteria and len(task) > 20
        self.calls.append(('non_comparative', source))
        result = {
            'novelty_tier': 'INCREMENTAL_VALIDATED', 'initial_eci_bps': 7600,
            'methodology_summary': 'Synthetic target RMSD <= 1.26 A with >=38% compute reduction.',
            'source_sha256': hashlib.sha256(self.pages['https://fixture.test/preprint'].encode()).hexdigest(),
        }
        if self.baseline_override is not None:
            result.update(self.baseline_override)
        return json.dumps(result)

    def prompt(self, prompt):
        self.calls.append(('prompt', prompt))
        if self.audit_override is not None:
            return json.dumps(self.audit_override)
        return json.dumps({
            'verdict': self.verdict, 'observed_variance_bps': 25,
            'audit_conclusion': 'Controlled fixture measurements satisfy the declared tolerance.',
            'eci_delta_bps': 999999, 'royalty_unlock_bps': 999999,
            'telemetry_sha256': 'untrusted-model-value',
        })

    def comparative(self, fn, *, principle):
        assert 'must match exactly' in principle and 'Independently' in principle
        self.calls.append(('comparative', principle))
        return fn()


class TestHeliosophiaContract(unittest.TestCase):
    def setUp(self):
        self.runtime = Runtime()
        runtime = self.runtime
        gl = SimpleNamespace(
            Contract=object,
            public=SimpleNamespace(write=lambda fn: fn, view=lambda fn: fn),
            message=SimpleNamespace(sender_address='0x1111111111111111111111111111111111111111'),
            eq_principle=SimpleNamespace(strict_eq=runtime.strict_eq,
                prompt_non_comparative=runtime.non_comparative,
                prompt_comparative=runtime.comparative),
            nondet=SimpleNamespace(web=SimpleNamespace(get=runtime.get), exec_prompt=runtime.prompt),
        )
        stub = ModuleType('genlayer')
        stub.__all__ = ['gl', 'TreeMap', 'u256']
        stub.gl, stub.TreeMap, stub.u256 = gl, dict, int
        old = sys.modules.get('genlayer')
        sys.modules['genlayer'] = stub
        try:
            path = Path(__file__).with_name('heliosophia_ledger.py')
            spec = importlib.util.spec_from_file_location('production_contract', path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
        finally:
            if old is None:
                sys.modules.pop('genlayer', None)
            else:
                sys.modules['genlayer'] = old
        self.ledger = module.HeliosophiaLedger()
        self.ledger.discoveries = {}
        self.ledger.replication_logs = {}
        self.ledger.evidence_seen = {}

    def register(self, **kwargs):
        args = dict(discovery_id='HLS-TEST', lead_author='Fixture Author', title='Synthetic structural benchmark',
            preprint_url='https://fixture.test/preprint',
            target_metric_clause='RMSD <= 1.26 Angstrom and compute reduction >= 38%.',
            royalty_pool_usdc=80000, replicator_share_bps=2000)
        args.update(kwargs)
        return json.loads(self.ledger.register_discovery(**args))

    def replicate(self, url='https://fixture.test/replication'):
        return json.loads(self.ledger.submit_replication_proof('HLS-TEST', 'Controlled fixture', url, 'Synthetic acceptance evidence.'))

    def test_registration_reads_source_and_non_comparative_baseline(self):
        record = self.register()
        self.assertEqual(self.ledger.get_discovery_count(), 1)
        self.assertEqual(record['epistemic_confidence_bps'], 7600)
        self.assertEqual(len(record['preprint_sha256']), 64)
        self.assertIn(('strict_eq', None), self.runtime.calls)
        self.assertTrue(any(c[0] == 'non_comparative' for c in self.runtime.calls))

    def test_success_and_audit_provenance(self):
        self.register()
        record = self.replicate()
        self.assertEqual(record['status'], 'REPLICATED_VERIFIED')
        self.assertEqual(record['epistemic_confidence_bps'], 9550)
        self.assertEqual((record['author_royalty_released'], record['replicator_royalty_released']), (64000, 16000))
        audit = json.loads(self.ledger.get_replication_log('HLS-TEST', 1))
        self.assertEqual(audit['telemetry_url'], 'https://fixture.test/replication')
        self.assertTrue(re.fullmatch(r'[0-9a-f]{64}', audit['telemetry_sha256']))
        self.assertEqual(record['settlement_mode'], 'ACCOUNTING_ONLY_NO_TOKEN_TRANSFER')

    def test_refutation_freezes_allocations(self):
        self.register()
        self.runtime.verdict = 'REPLICATION_REFUTED'
        record = self.replicate()
        self.assertEqual(record['status'], 'REFUTED_SLASHED')
        self.assertEqual(record['epistemic_confidence_bps'], 4100)
        self.assertEqual(record['author_royalty_released'] + record['replicator_royalty_released'], 0)

    def test_partial_evidence_cannot_unlock(self):
        self.register()
        self.runtime.verdict = 'PARTIAL_CONVERGENCE'
        record = self.replicate()
        self.assertEqual(record['status'], 'CONTESTED_VARIANCE')
        self.assertEqual(record['epistemic_confidence_bps'], 7600)
        self.assertEqual(record['author_royalty_released'], 0)

    def test_duplicate_id_preserves_count_and_record(self):
        self.register()
        before = self.ledger.get_discovery('HLS-TEST')
        with self.assertRaisesRegex(Exception, 'already registered'):
            self.register(title='Replacement')
        self.assertEqual(self.ledger.get_discovery('HLS-TEST'), before)
        self.assertEqual(self.ledger.get_discovery_count(), 1)

    def test_replay_same_content_under_another_url_is_rejected(self):
        self.register()
        self.replicate()
        self.runtime.pages['https://fixture.test/copy'] = self.runtime.pages['https://fixture.test/replication']
        with self.assertRaisesRegex(Exception, 'already submitted'):
            self.replicate('https://fixture.test/copy')
        self.assertEqual(json.loads(self.ledger.get_discovery('HLS-TEST'))['replication_count'], 1)

    def test_second_distinct_success_cannot_exceed_pool(self):
        self.register()
        self.replicate()
        self.runtime.pages['https://fixture.test/run2'] = '{"rmsd":1.20,"compute_reduction_pct":41.0,"fixture":true}'
        record = self.replicate('https://fixture.test/run2')
        self.assertEqual(record['author_royalty_released'] + record['replicator_royalty_released'], 80000)
        self.assertLessEqual(record['epistemic_confidence_bps'], 10000)

    def test_invalid_input_boundaries(self):
        for kwargs in [dict(discovery_id='a'), dict(preprint_url='ftp://fixture.test'),
                dict(replicator_share_bps=499), dict(replicator_share_bps=5001),
                dict(royalty_pool_usdc=0), dict(target_metric_clause='short'), dict(title='')]:
            with self.subTest(kwargs=kwargs), self.assertRaises(Exception):
                self.register(**kwargs)
        self.assertEqual(self.ledger.get_discovery_count(), 0)

    def test_invalid_baseline_hash_and_index_rejected(self):
        for override in [{'source_sha256': '0'*64}, {'initial_eci_bps': 9000}, {'novelty_tier': 'INVENTED'}]:
            self.runtime.baseline_override = override
            with self.subTest(override=override), self.assertRaises(Exception):
                self.register()
        self.assertEqual(self.ledger.get_discovery_count(), 0)

    def test_invalid_model_verdict_fails_closed(self):
        self.register()
        self.runtime.verdict = 'UNKNOWN'
        with self.assertRaisesRegex(Exception, 'Invalid replication verdict'):
            self.replicate()
        self.assertEqual(json.loads(self.ledger.get_discovery('HLS-TEST'))['replication_count'], 0)

    def test_invalid_model_variance_fails_closed(self):
        self.register()
        self.runtime.audit_override = {'verdict': 'REPLICATED_WITHIN_TOLERANCE', 'observed_variance_bps': -1}
        with self.assertRaisesRegex(Exception, 'Invalid observed variance'):
            self.replicate()

    def test_http_errors_fail_before_state_change(self):
        self.runtime.status = 404
        with self.assertRaisesRegex(Exception, 'retrieval failed'):
            self.register()
        self.assertEqual(self.ledger.get_discovery_count(), 0)

    def test_missing_discovery_and_unsafe_telemetry_url(self):
        with self.assertRaisesRegex(Exception, 'not found'):
            self.replicate()
        self.register()
        with self.assertRaisesRegex(Exception, 'http'):
            self.replicate('file:///etc/passwd')

    def test_missing_views_are_empty(self):
        self.assertEqual(self.ledger.get_discovery('missing'), '{}')
        self.assertEqual(self.ledger.get_replication_log('missing', 1), '{}')


if __name__ == '__main__':
    unittest.main(verbosity=2)
