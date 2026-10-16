# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-16T19:59:17.566Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.77% | 4034.07 | 2.581 a | 2.417 | -2.38% | 2.46% | 15/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.79% | 4702.58 | 3.447 a | 3.228 | -3.16% | 3.3% | 15/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.79% | 4650.12 | 4.953 a | 4.638 | -4.5% | 4.78% | 15/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.8% | 3256.04 | 5.836 a | 5.464 | -5.29% | 5.64% | 15/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.82% | 4655.94 | 6.628 a | 6.205 | -5.95% | 6.46% | 15/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.84% | 2713.48 | 8.584 a | 8.034 | -7.67% | 8.39% | 15/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.83% | 4614.72 | 7.721 a | 7.227 | -6.87% | 7.58% | 15/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.75% | 4520.51 | 9.382 a | 8.789 | -8.26% | 9.32% | 15/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.73% | 1946.62 | 13.841 a | 12.968 | -12.07% | 13.87% | 15/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.75% | 4539.28 | 10.921 a | 10.23 | -9.46% | 11% | 15/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.73% | 1432.33 | 18.592 a | 17.419 | -15.82% | 19.02% | 15/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.75% | 4425.02 | 12.446 a | 11.659 | -10.61% | 12.71% | 15/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.74% | 1017.35 | 23.847 a | 22.341 | -19.74% | 24.94% | 15/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.71% | 4490.44 | 13.128 a | 12.303 | -11.06% | 13.54% | 15/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.73% | 4385.8 | 13.997 a | 13.114 | -11.66% | 14.57% | 15/10/2026 |

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
