# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-10T18:43:29.473Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.57% | 3983.12 | 2.484 a | 2.309 | -2.27% | 2.35% | 09/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.65% | 4604.91 | 3.342 a | 3.104 | -3.04% | 3.17% | 09/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.72% | 4485.1 | 4.826 a | 4.48 | -4.35% | 4.61% | 09/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.75% | 3113.09 | 5.726 a | 5.314 | -5.15% | 5.48% | 09/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.72% | 4435.46 | 6.445 a | 5.983 | -5.74% | 6.23% | 09/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.75% | 2540.65 | 8.452 a | 7.844 | -7.5% | 8.19% | 09/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.65% | 4381.44 | 7.498 a | 6.965 | -6.63% | 7.3% | 09/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.51% | 4260.28 | 9.093 a | 8.458 | -7.96% | 8.96% | 09/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.45% | 1785.83 | 13.687 a | 12.738 | -11.87% | 13.61% | 09/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.46% | 4254.65 | 10.493 a | 9.764 | -9.04% | 10.48% | 09/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.38% | 1288.41 | 18.397 a | 17.132 | -15.59% | 18.68% | 09/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.45% | 4112.57 | 11.864 a | 11.042 | -10.08% | 12% | 09/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.37% | 890.52 | 23.615 a | 21.994 | -19.47% | 24.52% | 09/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.45% | 4137.54 | 12.354 a | 11.498 | -10.38% | 12.62% | 09/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.45% | 4028.91 | 13.095 a | 12.187 | -10.89% | 13.48% | 09/11/2026 |

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
