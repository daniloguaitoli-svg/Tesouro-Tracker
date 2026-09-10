# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-09-10T19:48:14.467Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.7% | 3888.11 | 2.679 a | 2.488 | -2.45% | 2.53% | 09/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.78% | 4489.89 | 3.538 a | 3.283 | -3.21% | 3.36% | 09/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.76% | 4383.01 | 5.027 a | 4.665 | -4.52% | 4.81% | 09/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.77% | 3044.4 | 5.934 a | 5.506 | -5.33% | 5.68% | 09/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.62% | 4369.29 | 6.665 a | 6.193 | -5.94% | 6.45% | 09/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.6% | 2517.34 | 8.682 a | 8.069 | -7.71% | 8.43% | 09/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.52% | 4330.06 | 7.732 a | 7.191 | -6.84% | 7.54% | 09/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.41% | 4208.49 | 9.333 a | 8.689 | -8.17% | 9.21% | 09/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.32% | 1778.7 | 13.94 a | 12.989 | -12.08% | 13.89% | 09/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.41% | 4187.9 | 10.735 a | 9.994 | -9.25% | 10.74% | 09/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 7.34% | 1270.82 | 18.69 a | 17.412 | -15.82% | 19.01% | 09/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.4% | 4050.7 | 12.113 a | 11.278 | -10.28% | 12.27% | 09/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 7.33% | 880.08 | 23.945 a | 22.31 | -19.72% | 24.9% | 09/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.36% | 4095.39 | 12.644 a | 11.777 | -10.62% | 12.94% | 09/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 7.35% | 3995.33 | 13.406 a | 12.488 | -11.14% | 13.83% | 09/09/2026 |

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
