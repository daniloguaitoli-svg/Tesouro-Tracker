# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-01T17:25:37.259Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 7.37% | 3948.17 | 2.622 a | 2.442 | -2.4% | 2.48% | 30/09/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 7.52% | 4561.18 | 3.483 a | 3.239 | -3.17% | 3.31% | 30/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 7.51% | 4466.57 | 4.976 a | 4.628 | -4.49% | 4.77% | 30/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 7.53% | 3107.25 | 5.877 a | 5.465 | -5.29% | 5.64% | 30/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 7.43% | 4452.86 | 6.622 a | 6.164 | -5.91% | 6.42% | 30/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 7.43% | 2570.41 | 8.625 a | 8.028 | -7.67% | 8.39% | 30/09/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 7.39% | 4402.17 | 7.691 a | 7.162 | -6.81% | 7.51% | 30/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 7.23% | 4305.22 | 9.316 a | 8.688 | -8.16% | 9.21% | 30/09/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 7.15% | 1831.12 | 13.882 a | 12.956 | -12.06% | 13.86% | 30/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 7.09% | 4354.96 | 10.815 a | 10.099 | -9.34% | 10.86% | 30/09/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.95% | 1369.16 | 18.633 a | 17.422 | -15.82% | 19.02% | 30/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 7.07% | 4234.97 | 12.274 a | 11.463 | -10.44% | 12.48% | 30/09/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.93% | 968.52 | 23.888 a | 22.34 | -19.74% | 24.94% | 30/09/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 7.01% | 4299.53 | 12.898 a | 12.053 | -10.85% | 13.26% | 30/09/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.99% | 4210.9 | 13.745 a | 12.847 | -11.44% | 14.25% | 30/09/2026 |

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
