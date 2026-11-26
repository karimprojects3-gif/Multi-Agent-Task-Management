from langchain_ollama import ChatOllama

llm = ChatOllama(
    model="qwen3:8b",
    temperature=0.3
)


def ask_ai(message: str):
    response = llm.invoke(message)

    return response.content