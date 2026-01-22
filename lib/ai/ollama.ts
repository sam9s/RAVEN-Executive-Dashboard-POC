import axios from 'axios'
import { AIMessage, AITool, AIResponse } from './types'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b'

// Interfaces executed to types.ts to share with OpenAI client

class OllamaClient {
  private async getCredentials() {
    try {
      const { getServiceSupabase } = await import('@/lib/supabase/client')
      const supabase = getServiceSupabase()

      const { data } = await supabase.from('settings').select('*').in('key', ['ollama_base_url', 'ollama_model'])

      let url = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')
      let model = process.env.OLLAMA_MODEL || 'llama3.1:8b'

      if (data) {
        const urlSetting = data.find(s => s.key === 'ollama_base_url')
        const modelSetting = data.find(s => s.key === 'ollama_model')

        if (urlSetting?.value) url = urlSetting.value.replace(/\/$/, '')
        if (modelSetting?.value) model = modelSetting.value
      }

      return { url, model }
    } catch (e) {
      return {
        url: (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, ''),
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b'
      }
    }
  }

  async chat(
    messages: AIMessage[],
    tools?: AITool[]
  ): Promise<{ success: boolean; response?: AIResponse; error?: string }> {
    try {
      const { url, model } = await this.getCredentials()

      const response = await axios.post(
        `${url}/api/chat`,
        {
          model: model,
          messages,
          tools,
          stream: false
        },
        { timeout: 180000 } // 180 second timeout (3 mins) for model loading
      )

      return { success: true, response: response.data }
    } catch (error: any) {
      console.error('Ollama chat error:', error.message)

      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Ollama timed out. The model might be loading into memory (this can take 1-2 mins first time). Please try again.'
        }
      }

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to Ollama. Make sure Docker is running and Ollama container is started.'
        }
      }

      return { success: false, error: error.message }
    }
  }

  async generate(prompt: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
      const { url, model } = await this.getCredentials()

      const response = await axios.post(
        `${url}/api/generate`,
        {
          model: model,
          prompt,
          stream: false
        },
        { timeout: 180000 }
      )

      return { success: true, text: response.data.response }
    } catch (error: any) {
      console.error('Ollama generate error:', error.message)
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'Ollama timed out (model loading).' }
      }
      return { success: false, error: error.message }
    }
  }

  async testConnection(): Promise<{ success: boolean; models?: string[]; error?: string }> {
    try {
      const { url } = await this.getCredentials()
      const response = await axios.get(`${url}/api/tags`, { timeout: 5000 })
      const models = response.data.models?.map((m: any) => m.name) || []
      return { success: true, models }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async isModelAvailable(): Promise<boolean> {
    const { model } = await this.getCredentials()
    const result = await this.testConnection()
    if (!result.success || !result.models) return false
    return result.models.some(m => m.includes(model.split(':')[0]))
  }
}


export const ollamaClient = new OllamaClient()
