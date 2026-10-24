# NTN-B — Tesouro IPCA+

Retrato gerado automaticamente em 2026-10-24T19:34:12.457Z.
Fonte: Tesouro Nacional (Tesouro Transparente).

| Vencimento | Título | Taxa real | PU (R$) | Duration | Dur. mod. | +1 p.p. | −1 p.p. | Data |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 15/05/2029 | Tesouro IPCA+ 2029 | 6.77% | 4034.07 | 2.559 a | 2.397 | -2.36% | 2.44% | 15/10/2026 |
| 15/08/2030 | Tesouro IPCA+ 2030 (juros semestrais) | 6.79% | 4702.58 | 3.425 a | 3.208 | -3.14% | 3.28% | 15/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 (juros semestrais) | 6.79% | 4650.12 | 4.931 a | 4.617 | -4.48% | 4.76% | 15/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 ⭐ | 6.8% | 3256.04 | 5.814 a | 5.444 | -5.27% | 5.62% | 15/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 (juros semestrais) | 6.82% | 4655.94 | 6.606 a | 6.184 | -5.93% | 6.44% | 15/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 ⭐ | 6.84% | 2713.48 | 8.562 a | 8.014 | -7.65% | 8.37% | 15/10/2026 |
| 15/05/2037 | Tesouro IPCA+ 2037 (juros semestrais) | 6.83% | 4614.72 | 7.699 a | 7.207 | -6.85% | 7.56% | 15/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 (juros semestrais) | 6.75% | 4520.51 | 9.36 a | 8.768 | -8.24% | 9.3% | 15/10/2026 |
| 15/08/2040 | Tesouro IPCA+ 2040 | 6.73% | 1946.62 | 13.819 a | 12.948 | -12.05% | 13.85% | 15/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 (juros semestrais) | 6.75% | 4539.28 | 10.899 a | 10.21 | -9.44% | 10.98% | 15/10/2026 |
| 15/05/2045 | Tesouro IPCA+ 2045 | 6.73% | 1432.33 | 18.57 a | 17.399 | -15.8% | 18.99% | 15/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 (juros semestrais) | 6.75% | 4425.02 | 12.424 a | 11.638 | -10.59% | 12.68% | 15/10/2026 |
| 15/08/2050 | Tesouro IPCA+ 2050 | 6.74% | 1017.35 | 23.825 a | 22.32 | -19.72% | 24.92% | 15/10/2026 |
| 15/05/2055 | Tesouro IPCA+ 2055 (juros semestrais) | 6.71% | 4490.44 | 13.106 a | 12.282 | -11.04% | 13.52% | 15/10/2026 |
| 15/08/2060 | Tesouro IPCA+ 2060 (juros semestrais) | 6.73% | 4385.8 | 13.975 a | 13.094 | -11.64% | 14.55% | 15/10/2026 |

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
