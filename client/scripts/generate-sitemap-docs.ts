import { promises as fs } from 'fs'
import path from 'path'

interface PageDoc {
  route: string
  filePath: string
  title: string
  description: string
  features: string[]
  middleware: string[]
}

/**
 * Scan a directory recursively for .vue files
 */
async function scanDir(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = await fs.readdir(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) {
      await scanDir(filePath, fileList)
    } else if (file.endsWith('.vue')) {
      fileList.push(filePath)
    }
  }
  return fileList
}

/**
 * Convert absolute file path to a Nuxt route path
 */
function getRouteFromPath(absolutePath: string, pagesDir: string): string {
  // Get path relative to app/pages/
  let relativePath = path.relative(pagesDir, absolutePath).replace(/\\/g, '/')
  
  // Remove file extension
  relativePath = relativePath.substring(0, relativePath.lastIndexOf('.'))
  
  // Handle index pages
  if (relativePath === 'index') {
    return '/'
  }
  if (relativePath.endsWith('/index')) {
    relativePath = relativePath.substring(0, relativePath.length - 6)
  }
  
  // Transform dynamic route parameters:
  // [[param]] -> :param? (optional parameter)
  // [param]   -> :param  (required parameter)
  let route = '/' + relativePath
  
  // Regex to replace double brackets first (optional params)
  route = route.replace(/\[\[([^\]]+)\]\]/g, ':$1?')
  
  // Regex to replace single brackets (required params)
  route = route.replace(/\[([^\]]+)\]/g, ':$1')
  
  return route
}

/**
 * Parse a Vue file to extract page documentation
 */
async function parseVueFile(filePath: string, pagesDir: string): Promise<PageDoc> {
  const content = await fs.readFile(filePath, 'utf-8')
  const route = getRouteFromPath(filePath, pagesDir)
  
  // 1. Try to extract explicit @page-docs block
  const docBlockRegex = /<!--\s*@page-docs([\s\S]*?)-->/
  const blockMatch = content.match(docBlockRegex)
  
  let title = ''
  let description = ''
  const features: string[] = []
  
  if (blockMatch && blockMatch[1]) {
    const blockContent = blockMatch[1]
    const lines = blockContent.split('\n')
    let parsingFeatures = false
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      if (trimmed.startsWith('title:')) {
        title = trimmed.substring(6).trim()
        parsingFeatures = false
      } else if (trimmed.startsWith('description:')) {
        description = trimmed.substring(12).trim()
        parsingFeatures = false
      } else if (trimmed.startsWith('features:')) {
        parsingFeatures = true
      } else if (parsingFeatures && (trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        const feature = trimmed.substring(1).trim()
        if (feature) features.push(feature)
      } else if (parsingFeatures && !trimmed.startsWith('-') && !trimmed.startsWith('*')) {
        if (trimmed.includes(':')) {
          parsingFeatures = false
        }
      }
    }
  }
  
  // 2. Fallbacks: Extract useSeoMeta/definePageMeta details if not fully documented
  if (!title) {
    // Look for useSeoMeta title
    const seoTitleRegex = /title:\s*(?:computed\(\(\)\s*=>\s*)?['"`](.*?)['"`]/
    const seoTitleMatch = content.match(seoTitleRegex)
    if (seoTitleMatch && seoTitleMatch[1]) {
      title = seoTitleMatch[1].replace(/Smak\s*\|\s*/i, '').trim()
    } else {
      // fallback to capitalized route path
      const parts = route.split('/').filter(Boolean)
      const lastPart = parts[parts.length - 1]
      title = lastPart ? lastPart.toUpperCase() : 'Home'
    }
  }
  
  if (!description) {
    // Look for useSeoMeta description
    const seoDescRegex = /description:\s*(?:computed\(\(\)\s*=>\s*)?['"`](.*?)['"`]/s
    const seoDescMatch = content.match(seoDescRegex)
    if (seoDescMatch && seoDescMatch[1]) {
      description = seoDescMatch[1].trim()
    } else {
      description = 'Additional page information is currently unavailable.'
    }
  }
  
  // Extract middleware guards
  const middleware: string[] = []
  const middlewareRegex = /middleware:\s*(?:\[(.*?)\]|['"`](.*?)['"`])/
  const middlewareMatch = content.match(middlewareRegex)
  if (middlewareMatch) {
    if (middlewareMatch[1]) {
      // Array like ['auth', 'verified']
      const items = middlewareMatch[1].split(',').map(i => i.replace(/['"`\s]/g, '')).filter(Boolean)
      middleware.push(...items)
    } else if (middlewareMatch[2]) {
      // String like 'auth'
      middleware.push(middlewareMatch[2].trim())
    }
  }
  
  return {
    route,
    filePath: path.relative(path.join(pagesDir, '../..'), filePath).replace(/\\/g, '/'),
    title,
    description,
    features,
    middleware
  }
}

/**
 * Main generator execution function
 */
export async function generateSiteDocs(projectRoot: string) {
  const pagesDir = path.join(projectRoot, 'app/pages')
  const publicDir = path.join(projectRoot, 'public')
  
  console.log(`[SiteDocs] Scanning directory: ${pagesDir}`)
  
  try {
    const pageFiles = await scanDir(pagesDir)
    console.log(`[SiteDocs] Found ${pageFiles.length} Vue pages`)
    
    const docsList: PageDoc[] = []
    
    for (const file of pageFiles) {
      // Skip folders or files that are not page-routing views
      // e.g. components or helper views inside page folders that don't match standard routing
      const doc = await parseVueFile(file, pagesDir)
      docsList.push(doc)
    }
    
    // Sort routes logically (root first, then alphabetically)
    docsList.sort((a, b) => {
      if (a.route === '/') return -1
      if (b.route === '/') return 1
      return a.route.localeCompare(b.route)
    })
    
    // Ensure public folder exists
    await fs.mkdir(publicDir, { recursive: true })
    
    // 1. Write public/site-structure.json
    const jsonPath = path.join(publicDir, 'site-structure.json')
    await fs.writeFile(jsonPath, JSON.stringify(docsList, null, 2), 'utf-8')
    console.log(`[SiteDocs] Successfully generated structured sitemap: ${jsonPath}`)
    
    // 2. Write public/site-docs.md (Markdown format for easy ingestion by AI)
    let mdContent = `# Culinary Platform SMAK — Site Structure & Features Documentation\n\n`
    mdContent += `This document is automatically generated based on the source code of the site pages. It contains a complete list of routes (links), page descriptions, and lists of available features. The AI assistant can use this description as a knowledge base to help users.\n\n`
    mdContent += `## List of All Available Links (Routes)\n\n`
    
    // Quick summary table
    mdContent += `| Route (URL) | Page Name | Access / Restrictions |\n`
    mdContent += `| :--- | :--- | :--- |\n`
    for (const doc of docsList) {
      const access = doc.middleware.length > 0 
        ? `🔐 Authorized (${doc.middleware.join(', ')})` 
        : `🌐 Public`
      mdContent += `| \`${doc.route}\` | **${doc.title}** | ${access} |\n`
    }
    
    mdContent += `\n---\n\n## Detailed Description of Pages and Features\n\n`
    
    for (const doc of docsList) {
      mdContent += `### 📍 Page: ${doc.title}\n\n`
      mdContent += `* **Route (URL):** \`${doc.route}\`\n`
      mdContent += `* **File Path:** \`${doc.filePath}\`\n`
      
      const access = doc.middleware.length > 0 
        ? `🔐 Requires authorization (middleware: \`${doc.middleware.join(', ')}\`)` 
        : `🌐 Public page (accessible to guests)`
      mdContent += `* **Accessibility:** ${access}\n\n`
      
      mdContent += `#### Page Description:\n${doc.description}\n\n`
      
      if (doc.features.length > 0) {
        mdContent += `#### Available Features (what can be done on this page):\n`
        for (const feature of doc.features) {
          mdContent += `- ${feature}\n`
        }
      } else {
        mdContent += `#### Available Features:\n- View the informational content of the page.\n`
      }
      
      mdContent += `\n---\n\n`
    }
    
    // Add tips for LLM assistant
    mdContent += `## 💡 Instructions for the AI Assistant:\n\n`
    mdContent += `1. **Navigation Assistance:** When a user asks where to find a specific feature (e.g., change allergies or pay for a plan), direct them to the corresponding URL route from the table above (e.g., \`/profile\` or \`/billing/plans\`).\n`
    mdContent += `2. **Step-by-Step Explanations:** Use the page feature lists to tell the user exactly what they can do in each section of the site.\n`
    mdContent += `3. **Access Conditions:** Warn the user if a feature requires logging in (Middleware: \`auth\`), email confirmation (\`verified\`), or an administrator role (\`admin\`).\n`
    
    const mdPath = path.join(publicDir, 'site-docs.md')
    await fs.writeFile(mdPath, mdContent, 'utf-8')
    console.log(`[SiteDocs] Successfully generated markdown sitemap: ${mdPath}`)
    
  } catch (err) {
    console.error(`[SiteDocs] Error during generation:`, err)
  }
}
