# Painel — Tesouro Tracker

Retrato gerado automaticamente em 2026-09-25T01:36:51.063Z.

## Acompanhados de perto

| Vencimento | Título | Taxa | Significa | PU (R$) | Duration | +1 p.p. | Data |
| --- | --- | ---: | --- | ---: | ---: | ---: | --- |
| 01/01/2029 | Tesouro Prefixado 2029 | 13.85% | juros nominais ao ano (a inflação do período corre por conta do investidor) | 746.11 | 2.271 a | -1.97% | 18/09/2026 |
| 01/03/2031 | Tesouro Selic 2031 | 0.07% | ágio/deságio sobre a Selic (não é uma taxa cheia; pode ser negativo) | 19851.5 | — | — | 18/09/2026 |
| 15/08/2032 | Tesouro IPCA+ 2032 | 7.58% | juros reais ao ano ACIMA do IPCA | 3083.29 | 5.893 a | -5.3% | 18/09/2026 |
| 15/05/2035 | Tesouro IPCA+ 2035 | 7.57% | juros reais ao ano ACIMA do IPCA | 2529.18 | 8.641 a | -7.67% | 18/09/2026 |

## Moldura

| Indicador | Valor | 12 meses | 1 semana | Data |
| --- | ---: | ---: | ---: | --- |
| IPCA (acum. 12m) | 4.22% | — | — | 01/08/2026 |
| Ibovespa | 183966 pts | 25.58% | -1.09% | 24/09/2026 |
| EUR/BRL | 5.8906 | -5.55% | -0.4% | 24/09/2026 |
| USD/BRL | 5.1795 | -2.48% | 0.53% | 24/09/2026 |
| CDI | 13.65% a.a. | — | — | 23/09/2026 |
| Selic (meta) | 13.75% a.a. | — | — | 25/09/2026 |

## Ressalvas

- São os vencimentos marcados como destaque no catálogo do repositório. A estrela do app é escolhida por aparelho (localStorage) e o servidor não a conhece — se a seleção do celular for outra, esta lista não a reflete.
- Taxas em % ao ano; veja `taxaSignifica` em cada título, porque o mesmo número quer dizer coisas diferentes por família. Duration em anos (dias corridos/365, aproximação da convenção oficial de dias úteis/252). variacaoPrecoMais1pp = variação % estimada do preço se a taxa subir 1 ponto percentual, já com convexidade. Variações de 12 meses e 1 semana comparam com o último pregão EM OU ANTES do alvo (mercado não abre em fim de semana); `desde` diz de que data a comparação parte. Campo ausente ou null = dado indisponível, nunca estimado.
- Fontes públicas, com defasagem de ao menos um dia útil. Uso informativo — não é recomendação de investimento.
