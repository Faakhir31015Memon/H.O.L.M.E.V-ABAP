import { UserMood, SystemDiagnostics } from '@holmev/shared-types';
import { ModelRouter } from './ModelRouter.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';

export interface ProcessUserMessageOptions {
  message: string;
  detectedMood?: UserMood;
  languageHint?: string;
  contextData?: Record<string, any>;
}

export interface ProcessUserMessageResult {
  reply: string;
  toolExecuted?: {
    name: string;
    arguments: any;
    result: any;
  };
  providerUsed: string;
  moodAdapted: UserMood;
  latencyMs: number;
}

export class AiOrchestrator {
  private modelRouter: ModelRouter;
  private toolRegistry: ToolRegistry;

  constructor(toolRegistry: ToolRegistry) {
    this.modelRouter = new ModelRouter();
    this.toolRegistry = toolRegistry;
  }

  async processUserMessage(options: ProcessUserMessageOptions): Promise<ProcessUserMessageResult> {
    const startTime = Date.now();
    const { message, detectedMood = 'NEUTRAL' } = options;

    // Mood-based conversational tone instructions
    let moodInstruction = 'Maintain a balanced, respectful, and helpfulJARVIS-like conversational tone.';
    switch (detectedMood) {
      case 'HAPPY':
        moodInstruction = 'The user appears happy. Respond with extra energy, warmth, and cheerful enthusiasm!';
        break;
      case 'SAD':
        moodInstruction = 'The user appears sad or down. Respond gently, calmly, with a supportive and caring tone.';
        break;
      case 'ANGRY':
        moodInstruction = 'The user appears frustrated or angry. Keep responses concise, calm, polite, and direct without arguing.';
        break;
      case 'TIRED':
        moodInstruction = 'The user appears tired. Keep answers clear, relaxed, and concise to avoid unnecessary friction.';
        break;
      case 'SURPRISED':
        moodInstruction = 'The user appears surprised. Use an engaging, intrigued tone.';
        break;
    }

    const systemInstruction = `You are H.O.L.M.E.V, a real-time multimodal personal AI operating system inspired by JARVIS.
You communicate naturally in the language spoken by the user (English, Roman Urdu, Urdu, or Hindi).
If spoken in Roman Urdu (e.g. "fan band kar do"), reply in natural Roman Urdu ("Ji Boss, fan off kar diya").
Address the user respectfully as "Boss" or "Mister Memon" when appropriate.
${moodInstruction}

You have access to real tools:
- web_search: Live Internet search for news, weather, prices, specs.
- smart_home: Real IoT device control (turn_on, turn_off, set_fan_speed, set_temperature).
- pc_control: Operating system control (open_application, open_url, create_folder, type_text).
- circuit_designer: 3D electronic circuit creation and engineering simulation.

Never invent fake tool outputs. Execute real tools and report real status.`;

    // Step 1: Model Router generates initial plan / tool call or direct response
    const modelResponse = await this.modelRouter.generateResponse({
      prompt: message,
      systemInstruction,
    });

    let finalReply = modelResponse.text;
    let toolExecuted: ProcessUserMessageResult['toolExecuted'];

    // Step 2: Check if response contains a tool call directive
    if (modelResponse.text.includes('TOOL_CALL:')) {
      const match = modelResponse.text.match(/TOOL_CALL:\s*(\w+)\s*(\{[\s\S]*?\})/);
      if (match) {
        const toolName = match[1];
        try {
          const toolArgs = JSON.parse(match[2]);
          const executionResult = await this.toolRegistry.executeTool(toolName, toolArgs);

          toolExecuted = {
            name: toolName,
            arguments: toolArgs,
            result: executionResult.result,
          };

          if (executionResult.success) {
            const toolMsg = executionResult.result?.message || executionResult.result?.summary;
            if (toolMsg) {
              finalReply = toolMsg;
            } else {
              finalReply = `Done Boss! ${toolName} execute kar diya.`;
            }
          } else {
            finalReply = executionResult.error || `Boss, ${toolName} execution failed.`;
          }
        } catch (parseErr) {
          console.warn('[AiOrchestrator] Tool args parse failed:', parseErr);
        }
      }
    }

    return {
      reply: finalReply,
      toolExecuted,
      providerUsed: modelResponse.providerUsed,
      moodAdapted: detectedMood,
      latencyMs: Date.now() - startTime,
    };
  }
}
