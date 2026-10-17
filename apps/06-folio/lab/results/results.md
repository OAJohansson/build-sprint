# Folio recommender: results

Written by `scripts/run_eval.py`; don't edit by hand. K = 10. Ranges are 95% bootstrap
confidence intervals over readers. Headline: NDCG@10 on readers, hide last 1.

| Step | Model | Run | Readers | NDCG@10 | Hit rate@10 | MRR | Recall@10 | NDCG 5★ | Regret | Coverage | Novelty | Top-100 share | Author spread |
| --- | --- | --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 baselines | random | readers, hide last 1 | 10000 | 0.000 (0.000–0.001) | 0.1% (0.0%–0.1%) | 0.000 (0.000–0.000) | 0.1% (0.0%–0.1%) | 0.000 | – | 100.0% | 7.5 | 1% | 1.00 |
| 1 baselines | random | readers, hide last 5 | 10000 | 0.001 (0.000–0.001) | 0.4% (0.3%–0.5%) | 0.001 (0.001–0.002) | 0.1% (0.1%–0.1%) | 0.001 | 41% of 71 | 100.0% | 7.5 | 1% | 1.00 |
| 1 baselines | random | you, all 48 liked | 48 | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 | – | 4.6% | 7.5 | 1% | 0.99 |
| 1 baselines | random | you, the 16 in goodbooks | 16 | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 | – | 1.6% | 7.5 | 2% | 1.00 |
| 1 baselines | most popular | readers, hide last 1 | 10000 | 0.010 (0.008–0.011) | 2.0% (1.7%–2.2%) | 0.007 (0.005–0.008) | 2.0% (1.7%–2.2%) | 0.012 | – | 0.6% | 1.7 | 100% | 0.59 |
| 1 baselines | most popular | readers, hide last 5 | 10000 | 0.019 (0.018–0.021) | 8.3% (7.8%–8.8%) | 0.031 (0.029–0.034) | 2.5% (2.3%–2.7%) | 0.020 | 31% of 1823 | 0.6% | 1.7 | 100% | 0.59 |
| 1 baselines | most popular | you, all 48 liked | 48 | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 | – | 0.1% | 1.6 | 100% | 0.53 |
| 1 baselines | most popular | you, the 16 in goodbooks | 16 | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 (0.000–0.000) | 0.0% (0.0%–0.0%) | 0.000 | – | 0.1% | 1.6 | 100% | 0.53 |
