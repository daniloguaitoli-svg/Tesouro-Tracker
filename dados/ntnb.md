# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-18T22:39:39.342Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.43% | 3919.56 | 2.658 a | 2.474 | -2.43% | 2.52% | 17/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.55% | 4530.14 | 3.518 a | 3.271 | -3.2% | 3.34% | 17/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.59% | 4424.1 | 5.009 a | 4.656 | -4.51% | 4.8% | 17/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.61% | 3075.64 | 5.912 a | 5.494 | -5.32% | 5.67% | 17/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.54% | 4397.17 | 6.65 a | 6.183 | -5.93% | 6.44% | 17/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.55% | 2531.08 | 8.66 a | 8.052 | -7.69% | 8.41% | 17/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.46% | 4354.84 | 7.718 a | 7.182 | -6.83% | 7.53% | 17/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.33% | 4243.61 | 9.329 a | 8.692 | -8.17% | 9.21% | 17/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.26% | 1795 | 13.918 a | 12.976 | -12.07% | 13.88% | 17/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.31% | 4235.71 | 10.756 a | 10.023 | -9.27% | 10.77% | 17/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.24% | 1294.77 | 18.668 a | 17.408 | -15.81% | 19% | 17/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.28% | 4111.53 | 12.17 a | 11.344 | -10.34% | 12.35% | 17/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.19% | 909.06 | 23.923 a | 22.319 | -19.72% | 24.91% | 17/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.19% | 4184.14 | 12.772 a | 11.916 | -10.73% | 13.1% | 17/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.18% | 4087 | 13.569 a | 12.66 | -11.29% | 14.03% | 17/09/2026 |

## Como ler

- **Taxa real** — juros ao ano *acima* do IPCA. É a taxa de compra (recompra do
  Tesouro); títulos fora de oferta deixam de publicar a taxa de venda, mas seguem
  publicando esta.
- **PU** — preço unitário em reais, do mesmo lado da taxa.
- **Duration** — prazo médio ponderado dos fluxos, em anos (Macaulay). Para o
  Tesouro IPCA+ sem cupom, é igual ao prazo; com juros semestrais é bem menor,
  porque parte do dinheiro volta antes.
- **Dur. mod.** — duration modificada: a variação percentual aproximada do preço
  para cada 1 ponto percentual de variação da taxa.
- **+1 p.p. / −1 p.p.** — quanto o preço se move hoje se a taxa real subir ou cair
  1 ponto percentual, já com o termo de convexidade (por isso não são simétricos).
- ⭐ marca os vencimentos acompanhados de perto.
- Os números usam **ponto decimal** e as datas dos arquivos .json usam **ISO
  (aaaa-mm-dd)**. É um arquivo de intercâmbio: o ponto decimal evita a ambiguidade
  do formato brasileiro para quem lê por máquina. Na tabela acima as datas
  aparecem em dd/mm/aaaa por legibilidade.

## Ressalvas

- Os dados têm defasagem de pelo menos um dia útil: o arquivo do Tesouro é de
  fechamento e este retrato é gerado uma vez por dia.
- Duration e sensibilidade usam dias corridos/365. A convenção oficial da ANBIMA
  para NTN-B é dias úteis/252 — a diferença é desprezível para duration, mas existe.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
