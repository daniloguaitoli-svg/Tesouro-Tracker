# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-03T02:05:07.155Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.43% | 3944.53 | 2.616 a | 2.435 | -2.39% | 2.48% | 01/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.59% | 4553.37 | 3.477 a | 3.231 | -3.16% | 3.3% | 01/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.6% | 4450.51 | 4.968 a | 4.617 | -4.48% | 4.76% | 01/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.62% | 3093.76 | 5.871 a | 5.456 | -5.28% | 5.63% | 01/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.55% | 4422.66 | 6.608 a | 6.144 | -5.89% | 6.4% | 01/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.56% | 2545.29 | 8.619 a | 8.013 | -7.66% | 8.37% | 01/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.53% | 4360.94 | 7.668 a | 7.131 | -6.78% | 7.48% | 01/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.34% | 4266.82 | 9.285 a | 8.65 | -8.13% | 9.17% | 01/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.26% | 1806.32 | 13.877 a | 12.937 | -12.04% | 13.83% | 01/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.2% | 4309.46 | 10.762 a | 10.04 | -9.29% | 10.79% | 01/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.05% | 1346.37 | 18.627 a | 17.401 | -15.81% | 19% | 01/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.19% | 4179.74 | 12.189 a | 11.371 | -10.36% | 12.38% | 01/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.06% | 941.48 | 23.882 a | 22.307 | -19.72% | 24.9% | 01/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.11% | 4250.6 | 12.803 a | 11.953 | -10.77% | 13.14% | 01/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.1% | 4154.42 | 13.617 a | 12.714 | -11.33% | 14.1% | 01/10/2026 |

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
