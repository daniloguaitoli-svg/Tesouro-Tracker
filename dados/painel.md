# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-08-29T15:40:32.594Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 14.08% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 737.3 | 2.345 a | -2.03% | 28/08/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.07% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 19708.55 | — | — | 28/08/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.93% | juros reais ao ano ACIMA do IPCA | 3014.24 | 5.967 a | -5.35% | 28/08/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.76% | juros reais ao ano ACIMA do IPCA | 2482.41 | 8.715 a | -7.72% | 28/08/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | — | — | — | — |
| Ibovespa | 175135 pts | 25.81% | 4.29% | 27/08/2026 |
| EUR/BRL | — | — | — | — |
| USD/BRL | — | — | — | — |
| CDI | 13.9% a.a. | — | — | 27/08/2026 |
| Selic (meta) | — | — | — | — |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
