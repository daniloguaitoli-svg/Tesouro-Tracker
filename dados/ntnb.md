# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-11-26T20:15:21.940Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.45% | 4010.85 | 2.44 a | 2.271 | -2.23% | 2.31% | 25/11/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.63% | 4627.34 | 3.298 a | 3.065 | -3% | 3.13% | 25/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.77% | 4494.33 | 4.781 a | 4.436 | -4.31% | 4.57% | 25/11/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.82% | 3114.94 | 5.683 a | 5.27 | -5.11% | 5.43% | 25/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.82% | 4286.49 | 6.606 a | 6.127 | -5.88% | 6.37% | 25/11/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.87% | 2527.79 | 8.409 a | 7.795 | -7.46% | 8.14% | 25/11/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.71% | 4240.26 | 7.697 a | 7.146 | -6.8% | 7.49% | 25/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.59% | 4249.49 | 9.031 a | 8.394 | -7.9% | 8.89% | 25/11/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.54% | 1772.92 | 13.643 a | 12.686 | -11.82% | 13.55% | 25/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.57% | 4085.5 | 10.764 a | 10.007 | -9.27% | 10.74% | 25/11/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.52% | 1263.18 | 18.353 a | 17.07 | -15.53% | 18.61% | 25/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.59% | 4066.9 | 11.73 a | 10.902 | -9.96% | 11.85% | 25/11/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.57% | 855.83 | 23.571 a | 21.913 | -19.41% | 24.42% | 25/11/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.56% | 3961.41 | 12.653 a | 11.764 | -10.63% | 12.9% | 25/11/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.57% | 3987.5 | 12.924 a | 12.015 | -10.75% | 13.28% | 25/11/2026 |

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
