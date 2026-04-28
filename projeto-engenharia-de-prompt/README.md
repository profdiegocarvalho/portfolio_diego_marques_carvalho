# 🚀 Batalha de Modelos & Engenharia de Prompt (XML)

## 📝 Descrição do Projeto
Este projeto foi desenvolvido pelos alunos **Victoria Cerqueira Viana**, **Chrystiann Caesar Sangiorgi de Oliveira** e **Gabriel Paiva Da Silva Souza** como parte da disciplina de Engenharia de Prompt e Aplicações em IA. O objetivo foi testar a eficácia de um prompt estruturado em **XML** para a criação de uma página HTML Single Page voltada para a "Busca Inteligente de Estágios".

A análise focou na conformidade técnica das IAs em relação a instruções estritas, como o uso de uma paleta de cores específica (azul vibrante e roxo destaque) e a implementação de seções obrigatórias como menu de âncoras e portfólio, sem priorizar apenas a estética, mas sim a fidelidade ao que foi solicitado.

http://googleusercontent.com/image_generation_content/0
*Figura 1: Representação da estrutura XML utilizada para guiar os modelos de IA.*

## 🚀 Tecnologias Utilizadas
* **Linguagens:** HTML5, CSS3
* **Arquitetura de Prompt:** Estruturação via Tags XML
* **Modelos Avaliados:** ChatGPT, Gemini, Claude, Qwen, DeepSeek, Grok e Maritaca

## 📊 Resultados e Aprendizados
O experimento revelou que a estrutura XML facilita a compreensão de alguns modelos, enquanto outros ainda possuem dificuldade em seguir restrições de design e sintaxe.

* **DeepSeek** foi o grande destaque, demonstrando compreensão exata do prompt e sendo a ferramenta escolhida para códigos complexos.
* **Claude** apresentou a maior verbosidade (4.800 tokens), porém fugiu do prompt e entregou um layout "amassado".
* **Maritaca** e **ChatGPT** apresentaram os resultados mais simples ou com mais erros técnicos.

### Quadro de Análise Comparativa
| IA | Precisão do Resultado | Precisão do HTML | Quantidade de Tokens |
| :--- | :--- | :--- | :--- |
| **DeepSeek** | Exatamente o que eu pedi | Simples e fácil de entender | 3.200 |
| **Gemini** | Entregou o que solicitei | Alguns erros simples | 1.350 |
| **Grok** | Não entregou todos componentes | HTML justo, falta detalhes | 2.850 |
| **Qwen** | Não gostei, muito simples | Estrutura muito básica | 1.300 |
| **GPT** | Péssimo em cativar | Muito simples | 900 a 1100 |
| **Claude** | Fugiu do prompt pedido | Caracteres desnecessários | 4.800 |
| **Maritaca** | Muito ruim | Muitos erros | 1.100 |

![Gráfico de Performance e Métricas](IMAGEM_2_AQUI)
*Figura 2: Comparação de eficiência e precisão técnica entre os modelos.*

## 🔧 Como Executar
1. Utilize o prompt estruturado dentro das tags `<tarefa>` e `<diretrizes_design>`.
2. Insira o código em um dos modelos de linguagem testados.
3. Valide se a saída respeita a paleta de cores: **#F9FAFB**, **#3B82F6** e **#8B5CF6**.
4. Verifique a funcionalidade das âncoras do menu e do rodapé.

![Demonstração do Fluxo de Dados](IMAGEM_3_AQUI)
*Figura 3: Pipeline de teste e avaliação de conformidade XML.*

---
[Voltar ao início](https://github.com/seu-usuario/seu-usuario)
