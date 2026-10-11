# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-11T01:59:01.704Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.62% | 4042.91 | 2.595 a | 2.433 | -2.39% | 2.47% | 09/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.66% | 4715.57 | 3.462 a | 3.246 | -3.17% | 3.32% | 09/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.64% | 4675.84 | 4.97 a | 4.661 | -4.52% | 4.8% | 09/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.65% | 3278.07 | 5.849 a | 5.485 | -5.31% | 5.66% | 09/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.65% | 4698.46 | 6.654 a | 6.24 | -5.98% | 6.5% | 09/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.66% | 2748.88 | 8.597 a | 8.06 | -7.7% | 8.42% | 09/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.66% | 4664.96 | 7.756 a | 7.272 | -6.91% | 7.63% | 09/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.55% | 4594.09 | 9.441 a | 8.86 | -8.32% | 9.4% | 09/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.51% | 1999.88 | 13.855 a | 13.008 | -12.1% | 13.92% | 09/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.53% | 4636.15 | 11.029 a | 10.353 | -9.57% | 11.14% | 09/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.49% | 1491.05 | 18.605 a | 17.472 | -15.86% | 19.08% | 09/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.52% | 4539.3 | 12.614 a | 11.841 | -10.77% | 12.91% | 09/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.48% | 1076.35 | 23.86 a | 22.408 | -19.79% | 25.02% | 09/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.47% | 4619.38 | 13.362 a | 12.55 | -11.27% | 13.83% | 09/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.47% | 4532.97 | 14.309 a | 13.44 | -11.93% | 14.95% | 09/10/2026 |

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
