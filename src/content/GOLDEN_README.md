## **How `getGoldenIdValue()` Works**

The `getGoldenIdValue()` method extracts the GitHub username from a specific HTML element on the page. Let me explain how it works:

### **Current Implementation:**

```typescript
public getGoldenIdValue(): string | null {
  try {
    // Look for the specific span element with GitHub username
    const usernameElement = document.querySelector('span.p-nickname.vcard-username.d-block[itemprop="additionalName"]');
    
    if (usernameElement && usernameElement.textContent) {
      // Extract and clean the text content
      const username = usernameElement.textContent.trim();
      if (username) {
        return username;
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting golden ID:', error);
    return null;
  }
}
```

### **Step-by-Step Breakdown:**

1. **`document.querySelector()`** - Searches the entire page for an HTML element
2. **CSS Selector** - `'span.p-nickname.vcard-username.d-block[itemprop="additionalName"]'` targets:
   - `span` - A span element
   - `.p-nickname` - With class "p-nickname"
   - `.vcard-username` - AND class "vcard-username" 
   - `.d-block` - AND class "d-block"
   - `[itemprop="additionalName"]` - AND attribute itemprop="additionalName"

3. **Text Extraction** - Gets the text content from the element
4. **Cleaning** - Removes whitespace with `.trim()`
5. **Validation** - Returns the value if found, null if not

### **Target HTML Element:**
```html
<span class="p-nickname vcard-username d-block" itemprop="additionalName">
  javierhbr
</span>
```

## **How to Change It to Search for Other Values**

Here are different approaches depending on what you want to extract:

### **Option 1: Change to Different GitHub Elements**

For GitHub profile name instead of username:
```typescript
public getGoldenIdValue(): string | null {
  try {
    // Look for the profile name instead of username
    const nameElement = document.querySelector('span.p-name.vcard-fullname.d-block[itemprop="name"]');
    
    if (nameElement && nameElement.textContent) {
      return nameElement.textContent.trim();
    }
    return null;
  } catch (error) {
    console.error('Error extracting golden ID:', error);
    return null;
  }
}
```

### **Option 2: Multiple Fallback Options**

Search for different elements in order of preference:
```typescript
public getGoldenIdValue(): string | null {
  try {
    // Array of selectors to try in order
    const selectors = [
      'span.p-nickname.vcard-username.d-block[itemprop="additionalName"]', // GitHub username
      'span.p-name.vcard-fullname.d-block[itemprop="name"]',               // GitHub full name
      '[data-testid="user-profile-name"]',                                  // Alternative selector
      '.js-profile-editable-replace .p-nickname'                           // Fallback
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const value = element.textContent.trim();
        if (value) {
          return value;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting golden ID:', error);
    return null;
  }
}
```

### **Option 3: Extract from Different Websites**

For non-GitHub sites, change the selector completely:
```typescript
public getGoldenIdValue(): string | null {
  try {
    // Example: Extract from LinkedIn
    const linkedInElement = document.querySelector('.text-heading-xlarge');
    
    // Example: Extract from Twitter/X
    const twitterElement = document.querySelector('[data-testid="UserName"]');
    
    // Example: Extract from a custom site
    const customElement = document.querySelector('#user-id, .username, [data-user]');

    // Try different selectors based on current domain
    const currentDomain = window.location.hostname;
    
    if (currentDomain.includes('linkedin.com') && linkedInElement) {
      return linkedInElement.textContent?.trim() || null;
    } else if (currentDomain.includes('twitter.com') && twitterElement) {
      return twitterElement.textContent?.trim() || null;
    } else if (customElement) {
      return customElement.textContent?.trim() || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting golden ID:', error);
    return null;
  }
}
```

### **Option 4: Extract from Data Attributes**

If the value is stored in data attributes instead of text:
```typescript
public getGoldenIdValue(): string | null {
  try {
    // Extract from data attributes
    const element = document.querySelector('[data-user-id]');
    
    if (element) {
      // Get from data attribute instead of text content
      const userId = element.getAttribute('data-user-id');
      if (userId) {
        return userId.trim();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting golden ID:', error);
    return null;
  }
}
```

### **Option 5: Extract from URL Parameters**

If the value is in the URL:
```typescript
public getGoldenIdValue(): string | null {
  try {
    const url = new URL(window.location.href);
    
    // Extract from URL path: /user/username
    const pathMatch = url.pathname.match(/\/user\/([^\/]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }
    
    // Extract from URL parameter: ?user=username
    const userParam = url.searchParams.get('user');
    if (userParam) {
      return userParam;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting golden ID:', error);
    return null;
  }
}
```

## **How to Find the Right Selector**

1. **Open Developer Tools** (F12)
2. **Right-click the element** you want to extract
3. **Select "Inspect Element"**
4. **Right-click the highlighted HTML** in DevTools
5. **Choose "Copy > Copy selector"** for the CSS selector

Would you like me to modify the method to extract a specific value from a particular website?