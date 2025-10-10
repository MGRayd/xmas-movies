import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { processMarkdownWithCharacterNames } from "@/utils/markdownUtils";
import { useSettings } from "@/hooks/useSettings";

interface EnhancedMarkdownProps {
  children: string;
  autoBoldCharacters?: boolean;
}

export default function EnhancedMarkdown({ 
  children, 
  autoBoldCharacters: propAutoBold = true 
}: EnhancedMarkdownProps) {
  const { settings } = useSettings();
  const [processedContent, setProcessedContent] = useState<string>(children);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Combine prop setting with global setting
  const autoBoldCharacters = propAutoBold && settings.autoBoldCharacterNames;

  useEffect(() => {
    async function processContent() {
      if (!children || !autoBoldCharacters) {
        setProcessedContent(children);
        return;
      }

      setIsProcessing(true);
      try {
        const processed = await processMarkdownWithCharacterNames(children);
        setProcessedContent(processed);
      } catch (error) {
        console.error("Error processing markdown content:", error);
        setProcessedContent(children); // Fallback to original content
      } finally {
        setIsProcessing(false);
      }
    }

    processContent();
  }, [children, autoBoldCharacters]);

  if (isProcessing) {
    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
  }

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedContent}</ReactMarkdown>;
}
