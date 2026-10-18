# The LLM's raw mistakes

Written by `scripts/run_eval.py`. Per run: lists asked for, calls that failed, books it named, share found in the catalogue (the rest are real books outside it or made up; see the hallucination check), share already on the shelf, share repeated, and picks padded with bestsellers.

| Model | Run | Lists | Failed | Named | In catalogue | On shelf | Repeated | Padded |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| llm haiku-5-5 | 500 readers, hide last 1 | 500 | 0 | 7487 | 90% | 7.0% | 0.0% | 94 |
| llm haiku-5-5 | 500 readers, hide last 5 | 500 | 0 | 7473 | 90% | 5.1% | 0.0% | 91 |
| llm haiku-5-5 | you, all 48 liked | 48 | 0 | 720 | 78% | 17.1% | 0.0% | 82 |
| llm opus-5-5 | you, all 48 liked | 48 | 0 | 720 | 78% | 27.2% | 0.0% | 151 |
