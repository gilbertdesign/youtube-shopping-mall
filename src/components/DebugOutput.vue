<!-- src/components/DebugOutput.vue -->
<template>
    <div class="debug-output" v-if="showDebug">
      <div class="debug-header">
        <h3>Debug Output</h3>
        <div class="debug-actions">
          <button @click="copyToClipboard" class="copy-btn">Copy</button>
          <button @click="$emit('close')" class="close-btn">Close</button>
        </div>
      </div>
      
      <div class="debug-content">
        <pre>{{ content }}</pre>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'DebugOutput',
    props: {
      content: {
        type: [String, Object],
        required: true
      },
      showDebug: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close'],
    setup(props) {
      const copyToClipboard = () => {
        const textToCopy = typeof props.content === 'string' 
          ? props.content 
          : JSON.stringify(props.content, null, 2);
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            alert('Copied to clipboard!');
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
          });
      };
      
      return {
        copyToClipboard
      };
    }
  };
  </script>
  
  <style scoped>
  .debug-output {
    margin-top: 20px;
    background-color: #282c34;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .debug-header {
    background-color: #21252b;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #181a1f;
  }
  
  .debug-header h3 {
    margin: 0;
    color: #abb2bf;
    font-size: 16px;
  }
  
  .debug-actions {
    display: flex;
    gap: 8px;
  }
  
  .copy-btn, .close-btn {
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .copy-btn {
    background-color: #2c313a;
    color: #abb2bf;
  }
  
  .close-btn {
    background-color: #e06c75;
    color: #282c34;
  }
  
  .copy-btn:hover {
    background-color: #3b4048;
  }
  
  .close-btn:hover {
    background-color: #d84a58;
  }
  
  .debug-content {
    padding: 15px;
    max-height: 400px;
    overflow-y: auto;
  }
  
  pre {
    margin: 0;
    color: #abb2bf;
    font-family: monospace;
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  </style>