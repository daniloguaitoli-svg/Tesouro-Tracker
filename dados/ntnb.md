# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-09T15:09:50.653Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.72% | 3885.4 | 2.682 a | 2.49 | -2.45% | 2.53% | 08/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.82% | 4483.12 | 3.541 a | 3.284 | -3.21% | 3.36% | 08/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.79% | 4376.02 | 5.029 a | 4.665 | -4.52% | 4.81% | 08/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.8% | 3038.78 | 5.937 a | 5.507 | -5.33% | 5.68% | 08/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.63% | 4365.73 | 6.667 a | 6.195 | -5.94% | 6.45% | 08/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.6% | 2516.84 | 8.685 a | 8.071 | -7.71% | 8.43% | 08/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.51% | 4332.3 | 7.736 a | 7.195 | -6.84% | 7.55% | 08/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.39% | 4214.96 | 9.34 a | 8.697 | -8.17% | 9.22% | 08/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.29% | 1785.27 | 13.942 a | 12.995 | -12.09% | 13.9% | 08/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.37% | 4203.8 | 10.755 a | 10.017 | -9.27% | 10.77% | 08/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.28% | 1283.84 | 18.693 a | 17.425 | -15.83% | 19.02% | 08/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.35% | 4072.77 | 12.149 a | 11.317 | -10.32% | 12.32% | 08/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.25% | 895.66 | 23.948 a | 22.329 | -19.73% | 24.93% | 08/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.31% | 4118.75 | 12.691 a | 11.826 | -10.66% | 12.99% | 08/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.31% | 4014.56 | 13.452 a | 12.535 | -11.18% | 13.89% | 08/09/2026 |

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
