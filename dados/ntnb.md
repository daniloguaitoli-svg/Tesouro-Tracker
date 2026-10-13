# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-13T02:06:54.266Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.62% | 4042.91 | 2.589 a | 2.428 | -2.39% | 2.47% | 09/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.66% | 4715.57 | 3.456 a | 3.241 | -3.17% | 3.31% | 09/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.64% | 4675.84 | 4.965 a | 4.656 | -4.51% | 4.8% | 09/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.65% | 3278.07 | 5.844 a | 5.479 | -5.3% | 5.66% | 09/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.65% | 4698.46 | 6.649 a | 6.234 | -5.98% | 6.49% | 09/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.66% | 2748.88 | 8.592 a | 8.055 | -7.69% | 8.42% | 09/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.66% | 4664.96 | 7.751 a | 7.267 | -6.91% | 7.62% | 09/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.55% | 4594.09 | 9.435 a | 8.855 | -8.32% | 9.39% | 09/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.51% | 1999.88 | 13.849 a | 13.003 | -12.1% | 13.91% | 09/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.53% | 4636.15 | 11.024 a | 10.348 | -9.56% | 11.13% | 09/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.49% | 1491.05 | 18.6 a | 17.466 | -15.86% | 19.07% | 09/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.52% | 4539.3 | 12.608 a | 11.836 | -10.76% | 12.91% | 09/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.48% | 1076.35 | 23.855 a | 22.403 | -19.79% | 25.02% | 09/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.47% | 4619.38 | 13.356 a | 12.545 | -11.27% | 13.82% | 09/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.47% | 4532.97 | 14.304 a | 13.434 | -11.92% | 14.94% | 09/10/2026 |

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
