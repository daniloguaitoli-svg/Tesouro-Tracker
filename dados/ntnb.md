# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-19T01:55:09.021Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.49% | 3997.43 | 2.456 a | 2.285 | -2.25% | 2.32% | 17/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.67% | 4610.24 | 3.314 a | 3.078 | -3.01% | 3.14% | 17/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.74% | 4489.13 | 4.798 a | 4.453 | -4.32% | 4.58% | 17/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.78% | 3113.73 | 5.698 a | 5.287 | -5.12% | 5.45% | 17/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.73% | 4299.51 | 6.628 a | 6.153 | -5.9% | 6.4% | 17/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.76% | 2543.22 | 8.425 a | 7.818 | -7.48% | 8.16% | 17/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.67% | 4241.89 | 7.717 a | 7.167 | -6.82% | 7.51% | 17/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.54% | 4256.92 | 9.058 a | 8.423 | -7.93% | 8.92% | 17/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.49% | 1779.85 | 13.659 a | 12.707 | -11.84% | 13.57% | 17/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.52% | 4095.98 | 10.8 a | 10.045 | -9.31% | 10.78% | 17/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.47% | 1270.9 | 18.369 a | 17.092 | -15.55% | 18.63% | 17/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.53% | 4083.62 | 11.785 a | 10.959 | -10.01% | 11.91% | 17/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.49% | 868.84 | 23.587 a | 21.944 | -19.43% | 24.45% | 17/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.51% | 3975.08 | 12.711 a | 11.823 | -10.68% | 12.97% | 17/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.51% | 4006.61 | 13.004 a | 12.095 | -10.81% | 13.38% | 17/11/2026 |

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
- Prazo, duration e sensibilidade usam dias úteis/252, a convenção oficial do
  Tesouro e da ANBIMA. O calendário são os feriados nacionais.
- A sensibilidade é uma aproximação de segunda ordem (duration + convexidade), não
  uma reprecificação exata.
- Uso informativo. Não é recomendação de investimento.
