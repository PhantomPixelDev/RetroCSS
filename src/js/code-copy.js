/**
 * RetroCSS Code Copy Button
 * Adds copy functionality to code blocks
 */

const RetroCodeCopy = {
  init() {
    const codeBlocks = document.querySelectorAll('.retro-code');
    
    codeBlocks.forEach(block => {
      // Create copy button if it doesn't exist
      if (!block.querySelector('.retro-code-copy')) {
        const copyButton = document.createElement('button');
        copyButton.className = 'retro-code-copy';
        copyButton.textContent = 'Copy';
        block.appendChild(copyButton);
        
        // Add click event
        copyButton.addEventListener('click', async () => {
          const code = block.querySelector('code').textContent;
          
          try {
            await navigator.clipboard.writeText(code);
            
            // Visual feedback
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            copyButton.style.background = '#c0c0c0';
            
            // Reset button after 2 seconds
            setTimeout(() => {
              copyButton.textContent = originalText;
              copyButton.style.background = '';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy code:', err);
            copyButton.textContent = 'Failed to copy';
            copyButton.style.background = '#ffcccc';
            
            setTimeout(() => {
              copyButton.textContent = 'Copy';
              copyButton.style.background = '';
            }, 2000);
          }
        });
      }
    });
  }
};

// Expose globally for RetroCSS.js to pick up
window.RetroCodeCopy = RetroCodeCopy; 