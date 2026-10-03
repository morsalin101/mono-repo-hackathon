from typing import TypedDict, Annotated, Sequence, List
from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from ..models import AIConfiguration


class UIAction(BaseModel):
    action_type: str = Field(
        description=(
            "The type of action to perform. Options: 'navigate', 'fill_phone', "
            "'fill_amount', 'fill_account', 'fill_biller', 'fill_bank', "
            "'fill_merchant', 'proceed_next', 'speak'"
        )
    )
    value: str = Field(
        description=(
            "The value associated with the action, e.g., page name "
            "('home', 'account', 'history', 'more', 'cashout', 'send-money', "
            "'recharge', 'pay-bill', 'add-money', 'savings', 'fund-transfer', "
            "'request-money', 'make-payment', 'refer-earn', 'npsb'), "
            "phone number, amount, or spoken text. Use empty string if not applicable."
        ),
        default="",
    )


class UIActions(BaseModel):
    actions: List[UIAction] = Field(description="List of UI actions to execute in order.")


class AgentState(TypedDict):
    transcript: str
    current_page: str
    current_step: str
    mode: str
    conversation_history: List[dict]
    actions: List[dict]
    messages: Annotated[Sequence[BaseMessage], "add_messages"]


def build_history_context(history: List[dict]) -> str:
    """Format the last 6 turns into a readable conversation snippet."""
    if not history:
        return "No previous context."
    lines = []
    for entry in history[-6:]:
        role = "User" if entry.get("role") == "user" else "Assistant"
        lines.append(f"{role}: {entry.get('content', '')}")
    return "\n".join(lines)


def agent_node(state: AgentState):
    config = AIConfiguration.current()
    llm = ChatGoogleGenerativeAI(model=config.model_name, google_api_key=config.api_key)
    structured_llm = llm.with_structured_output(UIActions)

    from ..models import KnowledgeDocument
    docs = KnowledgeDocument.objects.all()
    rag_context = ""
    if docs.exists():
        rag_context = "\n\n".join([f"Document: {d.title}\n{d.content}" for d in docs])

    history_context = build_history_context(state.get("conversation_history", []))

    if state.get("mode") == "qa":
        prompt = f"""
You are an intelligent Q&A Agent for a mobile banking app (SohojPay).
The user asked in Bangla or English: "{state['transcript']}"

Here is the knowledge base context you should use to answer user queries:
{rag_context}

Instructions:
1. ONLY answer questions related to the software/services described in the context.
2. If the user asks something completely unrelated, politely refuse to answer.
3. Respond ONLY with a single 'speak' action containing your helpful, conversational answer in Bangla. Do NOT emit any other UI actions.
"""
    else:
        prompt = f"""
You are a strict text-to-JSON parser for a Bangla mobile banking app (SohojPay).

## CRITICAL CONTEXT — use this to understand the user's intent:
Current UI Page: **{state['current_page']}**
Current Step/Flow: {state.get('current_step', 'unknown')}

Recent Conversation History:
{history_context}

## Current User Input:
"{state['transcript']}"

## PAGE-AWARE CONTEXT RULES (highest priority):
- The user's intent is ALWAYS relative to the **current page** they are on.
- If page is 'recharge' and user says an amount ("20 taka", "বিশ টাকা") -> fill_amount for recharge. Do NOT navigate to send-money.
- If page is 'send-money' and user says a name or number -> fill_phone or fill_account. Do NOT navigate away.
- If page is 'cashout' and user says a number -> fill_phone (agent number). Do NOT navigate away.
- If page is 'pay-bill' and user says a biller/service name -> fill_biller. Do NOT navigate away.
- If page is 'add-money' and user says an amount -> fill_amount. Do NOT navigate.
- If the current page is ALREADY the target page, NEVER emit a navigate action — just fill the field.
- **NEVER navigate to another page or sidebar during an active transaction (like filling number or amount) unless the user EXPLICITLY says "যেতে চাই", "যাব", "দেখাও", "go to", "open", "show me" followed by a DIFFERENT page name.**

## Available pages for navigation:
home, account, history, more, cashout, send-money, recharge, pay-bill, add-money, savings, fund-transfer, request-money, make-payment, refer-earn, npsb.

## MULTI-ACTION EXAMPLES (emit MULTIPLE actions when needed):
- "মিনাকে ২০ টাকা পাঠাবো" (current page: home) -> [navigate:'send-money', fill_phone:'মিনা', fill_amount:'20', proceed_next:'', speak:'ঠিক আছে, নিশ্চিত করুন']
- "গ্রামীণফোনে ২০ টাকা রিচার্জ করবো" (current page: home) -> [navigate:'recharge', fill_phone:'গ্রামীণফোন', fill_amount:'20', proceed_next:'', speak:'ঠিক আছে, নিশ্চিত করুন']
- "২০ টাকা রিচার্জ করবো" (current page: recharge, step: amount) -> [fill_amount:'20', proceed_next:'', speak:'ঠিক আছে, নিশ্চিত করুন']

## INTERACTIVE STEP-BY-STEP EXAMPLES (THIS IS VERY IMPORTANT):
User says "ক্যাশআউট করতে চাই" (current page: home) -> [navigate:'cashout', speak:'কোন এজেন্ট নাম্বারে ক্যাশআউট করবেন?']
User says "করিম স্টোর" (current page: cashout, step: number) -> [fill_phone:'করিম স্টোর', proceed_next:'', speak:'এজেন্ট নাম্বার বসানো হয়েছে, কত টাকা ক্যাশআউট করবেন?']
User says "৫০০ টাকা" (current page: cashout, step: amount) -> [fill_amount:'500', proceed_next:'', speak:'৫০০ টাকা বসানো হয়েছে, নিশ্চিত করবেন কি?']
User says "হ্যাঁ" or "ঠিক আছে" (current page: cashout, step: review) -> [proceed_next:'', speak:'ট্রানজেকশন সফল হয়েছে।']
User says "টাকা পাঠাবো" -> [navigate:'send-money', speak:'কাকে পাঠাবেন?']
User says "মিনাকে" (on send-money, step: number) -> [fill_phone:'মিনা', proceed_next:'', speak:'নাম্বারটি বসানো হয়েছে, কত টাকা পাঠাবেন?']
User says "১০০ টাকা" (on send-money, step: amount) -> [fill_amount:'100', proceed_next:'', speak:'১০০ টাকা বসানো হয়েছে, নিশ্চিত করবেন কি?']
User says "হ্যাঁ" (on send-money, step: review) -> [proceed_next:'', speak:'ট্রানজেকশন সফল হয়েছে।']

## Action rules:
1. "টাকা পাঠাবো/পাঠাতে চাই" without being on send-money -> navigate to 'send-money', then ask for number.
2. "ক্যাশআউট করতে চাই" without being on cashout -> navigate to 'cashout', then ask for number.
3. "রিচার্জ করতে চাই" without being on recharge -> navigate to 'recharge', then ask for number.
4. "আমার একাউন্ট" or "account" -> navigate to 'account'
5. "হিস্ট্রি" or "history" -> navigate to 'history'
6. "আরো" or "more" -> navigate to 'more'
7. Any phrase with "যাব", "দেখাও", "go to", "show me" + page name -> navigate to that page.
8. FORBIDDEN: never generate navigate to 'admin'.
9. Person names (মিনা, রহিম, করিম, etc.) OR 11-digit phone numbers -> fill_phone with that value
10. Amounts (numbers or Bangla words: বিশ=20, পঞ্চাশ=50, একশ=100) -> fill_amount with ONLY the numeric value (e.g., "500" not "পাঁচশ")
11. **ALWAYS emit `proceed_next` in the same turn when you fill a field (number/name or amount).** For example, if you emit `fill_phone`, also emit `proceed_next` so the UI advances to the amount screen, and use `speak` to ask "কত টাকা পাঠাবেন?".
12. When the user provides the amount, emit `fill_amount` AND `proceed_next`, so the UI advances to the review screen, and use `speak` to ask "নিশ্চিত করবেন কি?".
13. If the user confirms (step: review), emit `proceed_next` to finish the transaction and say "ট্রানজেকশন সফল হয়েছে।".
14. Always add a 'speak' action with a short Bangla confirmation or question last.
"""

    try:
        result = structured_llm.invoke([HumanMessage(content=prompt)])
        actions_dict = [{"type": a.action_type, "value": a.value} for a in result.actions]
    except Exception as e:
        print(f"Error invoking structured LLM: {e}")
        actions_dict = []
    return {"actions": actions_dict}


def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_edge("agent", END)
    return workflow.compile()


def process_voice_command(
    transcript: str,
    current_page: str,
    current_step: str,
    mode: str = "ui_operator",
    conversation_history: list = None,
):
    t_lower = transcript.lower()
    if mode != "qa" and ("admin" in t_lower or "অ্যাডমিন" in t_lower):
        return [{"type": "speak", "value": "দুঃখিত, আপনার অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।"}]

    graph = build_graph()
    initial_state = {
        "transcript": transcript,
        "current_page": current_page,
        "current_step": current_step,
        "mode": mode,
        "conversation_history": conversation_history or [],
        "actions": [],
        "messages": [],
    }
    result = graph.invoke(initial_state)
    return result["actions"]
