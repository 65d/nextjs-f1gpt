"use client"
import Image from "next/image"
import f1gptlogo from "./assets/f1gptlogo.webp"
import { useChat } from "ai/react"
import { Message } from "ai"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "@/app/components/Bubble";

const Home = () => {
    const { input, handleInputChange, handleSubmit, isLoading, messages, append } = useChat()
    const noMessages = !messages || messages.length === 0;
    const handlePrompt = ( promptText ) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }
    return (
        <main>
            <Image src={f1gptlogo} width="250" alt="F1GPT Logo" />
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The Ultimate place for Formula One super fans!
                            Ask FIGPT anything about the fantastic topic of F1 racing and it will come back with the most up-to-date answers.
                            We hope you enjoy!
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>
                ):(
                    <>
                        {messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
                    </>
                )}

            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box" type="text" placeholder="Ask a question about F1" onChange={handleInputChange} value={input}/>
                <input type="submit"/>
            </form>
        </main>
    )
}

export default Home