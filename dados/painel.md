# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-10-09T17:28:40.861Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 12.53% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 771.05 | 2.233 a | -1.96% | 08/10/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.09% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 19981.94 | — | — | 08/10/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 6.82% | juros reais ao ano ACIMA do IPCA | 3240.94 | 5.855 a | -5.31% | 08/10/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 6.84% | juros reais ao ano ACIMA do IPCA | 2703.83 | 8.603 a | -7.69% | 08/10/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.58% | — | — | 01/09/2026 |
| Ibovespa | 208528 pts | 47.15% | 8.54% | 09/10/2026 |
| EUR/BRL | 5.5844 | -9.77% | -5.05% | 09/10/2026 |
| USD/BRL | 4.9892 | -6.81% | -4.49% | 09/10/2026 |
| CDI | 13.65% a.a. | — | — | 08/10/2026 |
| Selic (meta) | 13.75% a.a. | — | — | 09/10/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
