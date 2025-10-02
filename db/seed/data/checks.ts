import { InsertCheck } from "../../schema/checks"

/**
 * Initial checks registry
 * These are the baseline SEO and GPTeo checks that the scanner will run
 */
export const initialChecks: InsertCheck[] = [
  // ==========================================
  // SEO CHECKS
  // ==========================================
  
  // Meta & Title checks
  {
    key: "seo.meta.title",
    name: "Title Tag Present",
    description: "Page has a <title> tag with appropriate length (30-60 chars)",
    category: "seo",
    severity: "critical",
    weight: 15,
    config: {
      pageTypes: ["homepage", "product", "category"],
      thresholds: { minLength: 30, maxLength: 60 }
    },
    fixTemplate: "Add a descriptive <title> tag: <title>Your Page Title - Brand</title>"
  },
  {
    key: "seo.meta.description",
    name: "Meta Description Present",
    description: "Page has a meta description tag with appropriate length (120-160 chars)",
    category: "seo",
    severity: "high",
    weight: 10,
    config: {
      pageTypes: ["homepage", "product", "category"],
      thresholds: { minLength: 120, maxLength: 160 }
    },
    fixTemplate: '<meta name="description" content="Your compelling page description">'
  },
  {
    key: "seo.meta.canonical",
    name: "Canonical URL Set",
    description: "Page has a canonical URL tag to prevent duplicate content issues",
    category: "seo",
    severity: "high",
    weight: 10,
    config: {
      pageTypes: ["homepage", "product", "category"]
    },
    fixTemplate: '<link rel="canonical" href="https://yourdomain.com/page-url">'
  },
  
  // Indexability & crawlability
  {
    key: "seo.robots.indexable",
    name: "Page Indexable",
    description: "Page is not blocked by robots meta tag or noindex directive",
    category: "seo",
    severity: "critical",
    weight: 15,
    config: {
      pageTypes: ["homepage", "product", "category"]
    },
    fixTemplate: "Remove noindex directive or update robots meta: <meta name=\"robots\" content=\"index, follow\">"
  },
  {
    key: "seo.robots.txt",
    name: "Robots.txt Present",
    description: "Site has a valid robots.txt file",
    category: "seo",
    severity: "medium",
    weight: 5,
    config: {
      pageTypes: ["homepage"]
    }
  },
  {
    key: "seo.sitemap.xml",
    name: "XML Sitemap Present",
    description: "Site has an XML sitemap for search engines",
    category: "seo",
    severity: "high",
    weight: 10,
    config: {
      pageTypes: ["homepage"]
    }
  },
  
  // Content & structure
  {
    key: "seo.content.h1",
    name: "H1 Tag Present",
    description: "Page has exactly one H1 heading tag",
    category: "seo",
    severity: "medium",
    weight: 5,
    config: {
      pageTypes: ["homepage", "product", "category"]
    },
    fixTemplate: "<h1>Your Main Page Heading</h1>"
  },
  
  // Social & OpenGraph
  {
    key: "seo.opengraph.present",
    name: "OpenGraph Tags Present",
    description: "Page has OpenGraph meta tags for social sharing",
    category: "seo",
    severity: "low",
    weight: 5,
    config: {
      requiredFields: ["og:title", "og:description", "og:image"]
    },
    fixTemplate: '<meta property="og:title" content="Your Title">\n<meta property="og:description" content="Your description">\n<meta property="og:image" content="https://yourdomain.com/image.jpg">'
  },
  
  // Performance heuristics
  {
    key: "seo.performance.ttfb",
    name: "Time to First Byte",
    description: "Server responds quickly (TTFB < 600ms)",
    category: "seo",
    severity: "medium",
    weight: 10,
    config: {
      thresholds: { good: 200, fair: 600 }
    }
  },
  {
    key: "seo.performance.page_size",
    name: "Page Size Reasonable",
    description: "Page size is under 2MB for good load performance",
    category: "seo",
    severity: "low",
    weight: 5,
    config: {
      thresholds: { maxBytes: 2097152 } // 2MB
    }
  },

  // ==========================================
  // GPTEO CHECKS (AI-Readiness)
  // ==========================================
  
  // Product schema checks
  {
    key: "gpteo.schema.product.present",
    name: "Product Schema Present",
    description: "Page has valid JSON-LD Product schema with @type: Product",
    category: "gpteo",
    severity: "critical",
    weight: 30,
    config: {
      pageTypes: ["product"],
      requiredFields: ["@type", "name", "description", "image"]
    },
    docsUrl: "https://schema.org/Product",
    fixTemplate: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Detailed product description",
  "image": ["https://example.com/image.jpg"],
  "sku": "SKU-123",
  "brand": {
    "@type": "Brand",
    "name": "Brand Name"
  }
}
</script>`
  },
  {
    key: "gpteo.schema.product.complete",
    name: "Product Schema Complete",
    description: "Product schema includes recommended fields: name, sku, brand, image, description",
    category: "gpteo",
    severity: "high",
    weight: 15,
    config: {
      pageTypes: ["product"],
      requiredFields: ["name", "sku", "brand", "image", "description"]
    }
  },
  {
    key: "gpteo.schema.offer.present",
    name: "Offer Schema Present",
    description: "Product has Offer schema with price, currency, availability",
    category: "gpteo",
    severity: "critical",
    weight: 15,
    config: {
      pageTypes: ["product"],
      requiredFields: ["@type", "price", "priceCurrency", "availability", "url"]
    },
    fixTemplate: `"offers": {
  "@type": "Offer",
  "price": "29.99",
  "priceCurrency": "USD",
  "availability": "https://schema.org/InStock",
  "url": "https://example.com/product"
}`
  },
  
  // Identifiers
  {
    key: "gpteo.identifiers.present",
    name: "Product Identifiers Present",
    description: "Product has unique identifiers (GTIN, UPC, EAN, or SKU)",
    category: "gpteo",
    severity: "high",
    weight: 10,
    config: {
      pageTypes: ["product"],
      requiredFields: ["gtin13", "gtin14", "gtin8", "upc", "sku"]
    },
    fixTemplate: 'Add to Product schema: "gtin13": "1234567890123" or "sku": "PRODUCT-SKU"'
  },
  
  // Provenance & trust
  {
    key: "gpteo.provenance.contact",
    name: "Contact Information Visible",
    description: "Site has accessible contact or about page showing brand ownership",
    category: "gpteo",
    severity: "medium",
    weight: 5,
    config: {
      pageTypes: ["homepage"]
    }
  },
  {
    key: "gpteo.provenance.brand",
    name: "Brand Consistency",
    description: "Brand name is consistent across schema and visible content",
    category: "gpteo",
    severity: "medium",
    weight: 5,
    config: {
      pageTypes: ["product", "homepage"]
    }
  },
  
  // Policy transparency
  {
    key: "gpteo.policies.returns",
    name: "Return Policy Linked",
    description: "Returns/refund policy page is linked and accessible",
    category: "gpteo",
    severity: "high",
    weight: 10,
    config: {
      pageTypes: ["product", "homepage"]
    }
  },
  {
    key: "gpteo.policies.shipping",
    name: "Shipping Policy Linked",
    description: "Shipping policy page is linked and accessible",
    category: "gpteo",
    severity: "medium",
    weight: 5,
    config: {
      pageTypes: ["product", "homepage"]
    }
  },
  
  // Freshness signals
  {
    key: "gpteo.freshness.date_modified",
    name: "Last Modified Date Present",
    description: "Product has dateModified in schema or Last-Modified header",
    category: "gpteo",
    severity: "high",
    weight: 10,
    config: {
      pageTypes: ["product"]
    },
    fixTemplate: 'Add to Product schema: "dateModified": "2025-10-02T12:00:00Z"'
  },
  {
    key: "gpteo.freshness.recent",
    name: "Content Recently Updated",
    description: "Product data has been updated within the last 90 days",
    category: "gpteo",
    severity: "medium",
    weight: 5,
    config: {
      thresholds: { maxDaysOld: 90 }
    }
  },
  
  // AI feed & accessibility
  {
    key: "gpteo.feed.present",
    name: "AI Feed Available",
    description: "Site provides machine-readable feed at /ai-feed.json or similar",
    category: "gpteo",
    severity: "medium",
    weight: 10,
    config: {
      pageTypes: ["homepage"]
    },
    fixTemplate: `Create /ai-feed.json with:
{
  "brand": "Your Brand",
  "updated_at": "2025-10-02T12:00:00Z",
  "products": [...]
}`
  },
  {
    key: "gpteo.licensing.present",
    name: "AI Licensing Terms Present",
    description: "Site has explicit licensing/usage terms for AI assistants",
    category: "gpteo",
    severity: "low",
    weight: 5,
    config: {
      pageTypes: ["homepage"]
    },
    fixTemplate: 'Add licensing statement: "Data provided for use in AI assistants; attribution requested."'
  },
  
  // Content quality
  {
    key: "gpteo.content.attributes",
    name: "Structured Attributes Present",
    description: "Product description includes factual attributes (materials, dimensions, specs)",
    category: "gpteo",
    severity: "medium",
    weight: 10,
    config: {
      pageTypes: ["product"]
    }
  },
  {
    key: "gpteo.content.factual",
    name: "Fact-First Description Style",
    description: "Product description prioritizes facts over marketing language",
    category: "gpteo",
    severity: "low",
    weight: 5,
    config: {
      pageTypes: ["product"]
    }
  }
]

