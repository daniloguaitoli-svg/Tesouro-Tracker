# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-19T01:16:43.438Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.43% | 3919.56 | 2.655 a | 2.471 | -2.43% | 2.51% | 17/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.55% | 4530.14 | 3.515 a | 3.268 | -3.2% | 3.34% | 17/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.59% | 4424.1 | 5.006 a | 4.653 | -4.51% | 4.79% | 17/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.61% | 3075.64 | 5.91 a | 5.492 | -5.32% | 5.67% | 17/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.54% | 4397.17 | 6.647 a | 6.181 | -5.93% | 6.44% | 17/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.55% | 2531.08 | 8.658 a | 8.05 | -7.69% | 8.41% | 17/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.46% | 4354.84 | 7.715 a | 7.179 | -6.83% | 7.53% | 17/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.33% | 4243.61 | 9.326 a | 8.689 | -8.17% | 9.21% | 17/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.26% | 1795 | 13.915 a | 12.973 | -12.07% | 13.88% | 17/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.31% | 4235.71 | 10.753 a | 10.021 | -9.27% | 10.77% | 17/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.24% | 1294.77 | 18.666 a | 17.406 | -15.81% | 19% | 17/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.28% | 4111.53 | 12.168 a | 11.342 | -10.34% | 12.35% | 17/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.19% | 909.06 | 23.921 a | 22.316 | -19.72% | 24.91% | 17/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.19% | 4184.14 | 12.77 a | 11.913 | -10.73% | 13.09% | 17/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.18% | 4087 | 13.567 a | 12.658 | -11.28% | 14.03% | 17/09/2026 |

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
