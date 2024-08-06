const { AICaller } = require('cover_agent/AICaller');
const { jest } = require('@jest/globals');
const os = require('os');

describe('TestAICaller', () => {
    let aiCaller;

    beforeEach(() => {''
        aiCaller = new AICaller("test-model", "test-api");
    });

    test('call_model_simplified', async () => {
        const mockCallModel = jest.spyOn(AICaller.prototype, 'callModel').mockResolvedValue(["Hello world!", 2, 10]);
        const prompt = { system: "", user: "Hello, world!" };

        const [response, promptTokens, responseTokens] = await aiCaller.callModel(prompt, 4096);

        expect(response).toBe("Hello world!");
        expect(promptTokens).toBe(2);
        expect(responseTokens).toBe(10);

        expect(mockCallModel).toHaveBeenCalledWith(prompt, 4096);
        mockCallModel.mockRestore();
    });

    test('call_model_with_error', async () => {
        const mockCompletion = jest.spyOn(AICaller.prototype, 'completion').mockImplementation(() => {
            throw new Error("Test exception");
        });
        const prompt = { system: "", user: "Hello, world!" };

        await expect(aiCaller.callModel(prompt)).rejects.toThrow("Test exception");

        mockCompletion.mockRestore();
    });

    test('call_model_error_streaming', async () => {
        const mockCompletion = jest.spyOn(AICaller.prototype, 'completion').mockImplementation(() => {
            throw new Error("list index out of range");
        });
        const prompt = { system: "", user: "Hello, world!" };

        await expect(aiCaller.callModel(prompt)).rejects.toThrow("list index out of range");

        mockCompletion.mockRestore();
    });

    test('call_model_wandb_logging', async () => {
        process.env.WANDB_API_KEY = 'test_key';
        const mockCompletion = jest.spyOn(AICaller.prototype, 'completion').mockResolvedValue([{ choices: [{ delta: { content: "response" } }] }]);
        const mockLog = jest.spyOn(AICaller.prototype, 'log');
        const prompt = { system: "", user: "Hello, world!" };

        const mockBuilder = jest.spyOn(AICaller.prototype, 'stream_chunk_builder').mockReturnValue({
            choices: [{ message: { content: "response" } }],
            usage: { prompt_tokens: 2, completion_tokens: 10 }
        });

        const [response, promptTokens, responseTokens] = await aiCaller.callModel(prompt);

        expect(response).toBe("response");
        expect(promptTokens).toBe(2);
        expect(responseTokens).toBe(10);
        expect(mockLog).toHaveBeenCalled();

        mockCompletion.mockRestore();
        mockLog.mockRestore();
        mockBuilder.mockRestore();
    });

    test('call_model_api_base', async () => {
        const mockCompletion = jest.spyOn(AICaller.prototype, 'completion').mockResolvedValue([{ choices: [{ delta: { content: "response" } }] }]);
        aiCaller.model = "openai/test-model";
        const prompt = { system: "", user: "Hello, world!" };

        const mockBuilder = jest.spyOn(AICaller.prototype, 'stream_chunk_builder').mockReturnValue({
            choices: [{ message: { content: "response" } }],
            usage: { prompt_tokens: 2, completion_tokens: 10 }
        });

        const [response, promptTokens, responseTokens] = await aiCaller.callModel(prompt);

        expect(response).toBe("response");
        expect(promptTokens).toBe(2);
        expect(responseTokens).toBe(10);

        mockCompletion.mockRestore();
        mockBuilder.mockRestore();
    });

    test('call_model_with_system_key', async () => {
        const mockCompletion = jest.spyOn(AICaller.prototype, 'completion').mockResolvedValue([{ choices: [{ delta: { content: "response" } }] }]);
        const prompt = { system: "System message", user: "Hello, world!" };

        const mockBuilder = jest.spyOn(AICaller.prototype, 'stream_chunk_builder').mockReturnValue({
            choices: [{ message: { content: "response" } }],
            usage: { prompt_tokens: 2, completion_tokens: 10 }
        });

        const [response, promptTokens, responseTokens] = await aiCaller.callModel(prompt);

        expect(response).toBe("response");
        expect(promptTokens).toBe(2);
        expect(responseTokens).toBe(10);

        mockCompletion.mockRestore();
        mockBuilder.mockRestore();
    });

    test('call_model_missing_keys', () => {
        const prompt = { user: "Hello, world!" };

        expect(() => aiCaller.callModel(prompt)).toThrow("The prompt dictionary must contain 'system' and 'user' keys.");
    });
});
