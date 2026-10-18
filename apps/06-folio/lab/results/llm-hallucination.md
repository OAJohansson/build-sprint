# Hallucination check

Written by `scripts/check_unmatched.py`. Books the LLM named that aren't in the catalogue, a random 60 per run (seed 0), looked up on Open Library by title and author surname.

| Model | Run | Not in catalogue | Checked | Found on Open Library | Not found |
| --- | --- | ---: | ---: | ---: | ---: |
| llm haiku-5-5 | 500 readers, hide last 1 | 474 | 60 | 56 | 4 (7%) |
| llm haiku-5-5 | 500 readers, hide last 5 | 440 | 60 | 54 | 6 (10%) |
| llm haiku-5-5 | you, all 48 liked | 40 | 40 | 40 | 0 (0%) |
| llm opus-5-5 | you, all 48 liked | 31 | 31 | 28 | 3 (10%) |

## Not found (check by eye: made up, or just missing from Open Library?)

- llm haiku-5-5, 500 readers, hide last 1: *Never After* by Abbi Glines
- llm haiku-5-5, 500 readers, hide last 1: *Girls in Tights* by Ann Brashares
- llm haiku-5-5, 500 readers, hide last 1: *The Ides of Rome* by Rick Riordan
- llm haiku-5-5, 500 readers, hide last 1: *The Girl Who Could Fly* by Victoria Forster
- llm haiku-5-5, 500 readers, hide last 5: *Walking on Broken Glass* by Jamie McGuire
- llm haiku-5-5, 500 readers, hide last 5: *Jack of Fables, Vol. 1: The Full Lowdown* by Bill Willingham
- llm haiku-5-5, 500 readers, hide last 5: *Rock Chick Rebel* by Kristen Ashley
- llm haiku-5-5, 500 readers, hide last 5: *Specters* by Radwa Ashour
- llm haiku-5-5, 500 readers, hide last 5: *The Girl Who Circumnavigated Fairyland Half a World Away* by Catherynne M. Valente
- llm haiku-5-5, 500 readers, hide last 5: *The Pearl Maiden* by Maxine Kumin
- llm opus-5-5, you, all 48 liked: *Adam Kay's Undoctored* by Adam Kay
- llm opus-5-5, you, all 48 liked: *Homo Faber... no: The Silent Patient* by Alex Michaelides
- llm opus-5-5, you, all 48 liked: *Homo Sapiens? The Selfish Gene* by Richard Dawkins
