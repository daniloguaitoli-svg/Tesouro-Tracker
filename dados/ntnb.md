# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-16T01:29:24.213Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.72% | 4037.5 | 2.581 a | 2.418 | -2.38% | 2.46% | 14/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.72% | 4711.49 | 3.448 a | 3.231 | -3.16% | 3.3% | 14/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.71% | 4665.68 | 4.955 a | 4.643 | -4.5% | 4.78% | 14/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.72% | 3269.08 | 5.836 a | 5.468 | -5.29% | 5.64% | 14/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.73% | 4680.23 | 6.635 a | 6.216 | -5.96% | 6.47% | 14/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.74% | 2734.26 | 8.584 a | 8.042 | -7.68% | 8.4% | 14/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.75% | 4639.71 | 7.731 a | 7.242 | -6.89% | 7.6% | 14/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.64% | 4562.68 | 9.407 a | 8.821 | -8.29% | 9.36% | 14/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.61% | 1976.29 | 13.841 a | 12.983 | -12.08% | 13.89% | 14/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.64% | 4588.93 | 10.968 a | 10.285 | -9.51% | 11.06% | 14/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.61% | 1461.89 | 18.592 a | 17.439 | -15.84% | 19.04% | 14/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.64% | 4480.53 | 12.519 a | 11.74 | -10.68% | 12.8% | 14/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.62% | 1044.46 | 23.847 a | 22.366 | -19.76% | 24.97% | 14/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.61% | 4544.48 | 13.22 a | 12.4 | -11.14% | 13.66% | 14/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.62% | 4448.11 | 14.122 a | 13.246 | -11.77% | 14.72% | 14/10/2026 |

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
