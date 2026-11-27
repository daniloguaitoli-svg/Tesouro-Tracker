# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-27T02:56:31.881Z.
Fonte: Tesouro Nacional (Tesouro Transparente) + ANBIMA (mercado secundário).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.45% | 4010.85 | 2.437 a | 2.268 | -2.23% | 2.3% | 25/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.63% | 4627.34 | 3.294 a | 3.061 | -3% | 3.13% | 25/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.77% | 4494.33 | 4.777 a | 4.433 | -4.3% | 4.56% | 25/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.82% | 3114.94 | 5.679 a | 5.267 | -5.1% | 5.43% | 25/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.82% | 4286.49 | 6.602 a | 6.124 | -5.88% | 6.37% | 25/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.87% | 2527.79 | 8.405 a | 7.792 | -7.45% | 8.13% | 25/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.71% | 4240.26 | 7.693 a | 7.142 | -6.8% | 7.48% | 25/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.59% | 4249.49 | 9.027 a | 8.39 | -7.9% | 8.89% | 25/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.54% | 1772.92 | 13.639 a | 12.683 | -11.82% | 13.55% | 25/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.57% | 4085.5 | 10.76 a | 10.003 | -9.27% | 10.74% | 25/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.52% | 1263.18 | 18.349 a | 17.066 | -15.53% | 18.6% | 25/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.59% | 4066.9 | 11.726 a | 10.899 | -9.95% | 11.84% | 25/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.57% | 855.83 | 23.567 a | 21.909 | -19.41% | 24.41% | 25/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.56% | 3961.41 | 12.649 a | 11.76 | -10.62% | 12.9% | 25/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.57% | 3987.5 | 12.92 a | 12.011 | -10.74% | 13.28% | 25/11/2026 |

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
