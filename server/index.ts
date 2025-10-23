// Load environment variables from .env file
import "dotenv/config";

import {
  McpServer,
  registerOpenAIWidget,
  startOpenAIWidgetHttpServer,
} from "@fractal-mcp/oai-server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to read widget HTML files
function readWidgetHtml(filename: string): string {
  const distPath = path.join(process.cwd(), "dist", filename);
  if (!fs.existsSync(distPath)) {
    throw new Error(`Widget HTML file not found: ${distPath}`);
  }
  return fs.readFileSync(distPath, "utf-8");
}

// Helper to safely serialize objects (prevent circular refs and stack overflow)
function safeSerialize(obj: any, maxDepth = 10): any {
  const seen = new WeakSet();

  function serialize(value: any, depth: number): any {
    if (depth > maxDepth) {
      return '[Max Depth Reached]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular Reference]';
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map(item => serialize(item, depth + 1));
    }

    const result: any = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        result[key] = serialize(value[key], depth + 1);
      }
    }

    return result;
  }

  return serialize(obj, 0);
}

// Zod schemas for tool validation
const selectBrandSchema = z.object({
  brandId: z.string().uuid().describe("The brand ID to select"),
});

const selectProductSchema = z.object({
  productId: z.string().uuid().describe("The product ID to view"),
});

const showLeadFormSchema = z.object({
  brandId: z.string().uuid().describe("The brand ID"),
  productId: z.string().uuid().optional().describe("Optional product ID"),
  variantId: z.string().uuid().optional().describe("Optional variant ID"),
});

const leadPayloadSchema = z.object({
  brand_id: z.string().uuid().describe("The brand ID"),
  product_id: z.string().uuid().nullable().optional().describe("Optional product ID"),
  payload: z.record(z.unknown()).describe("Lead form data"),
  consent: z.boolean().default(false).describe("User consent flag"),
});

const trackEventSchema = z.object({
  type: z.enum(["search", "click"]).describe("Event type"),
  payload: z.record(z.unknown()).describe("Event data"),
});

function createServer() {
  const server = new McpServer({
    name: "affiliate-mcp",
    version: "1.0.0",
  });

  // ============================================
  // Widget: Brand List
  // ============================================
  registerOpenAIWidget(
    server,
    {
      id: "brand-list",
      title: "Chọn Thương Hiệu",
      description: "Hiển thị danh sách các thương hiệu đang hoạt động",
      templateUri: "ui://widget/brand-list.html",
      invoking: "Đang tải danh sách thương hiệu...",
      invoked: "Danh sách thương hiệu đã được tải!",
      html: readWidgetHtml("BrandList.html"),
      responseText: "Đây là danh sách các thương hiệu có sẵn.",
    },
    async () => {
      try {
        const { data: brands, error } = await supabase
          .from("brands")
          .select("*")
          .eq("active", true)
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching brands:", error);
          throw error;
        }

        // Clean data to reduce payload size
        const cleanBrands = (brands || []).map(b => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logo_url: b.logo_url,
          description: b.description,
          website_url: b.website_url,
        }));

        return {
          content: [
            {
              type: "text",
              text: `Tìm thấy ${brands?.length || 0} thương hiệu đang hoạt động.`,
            },
          ],
          structuredContent: { brands: cleanBrands },
        };
      } catch (error) {
        console.error("Failed to load brands:", error);
        return {
          content: [
            {
              type: "text",
              text: "Không thể tải danh sách thương hiệu. Vui lòng thử lại sau.",
            },
          ],
          structuredContent: { brands: [] },
        };
      }
    }
  );

  // ============================================
  // Tool/Widget: Select Brand
  // ============================================
  registerOpenAIWidget(
    server,
    {
      id: "select_brand",
      title: "Chọn Thương Hiệu",
      description: "Chọn thương hiệu và hiển thị danh sách sản phẩm",
      templateUri: "ui://widget/product-list.html",
      invoking: "Đang tải sản phẩm...",
      invoked: "Danh sách sản phẩm đã được tải!",
      html: readWidgetHtml("ProductList.html"),
      responseText: "Đây là danh sách sản phẩm của thương hiệu đã chọn.",
      inputSchema: selectBrandSchema,
    },
    async (args: z.infer<typeof selectBrandSchema>) => {
      try {
        // Fetch brand info
        const { data: brand, error: brandError } = await supabase
          .from("brands")
          .select("*")
          .eq("id", args.brandId)
          .single();

        if (brandError || !brand) {
          throw new Error("Brand not found");
        }

        // Fetch products for this brand
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("*")
          .eq("brand_id", args.brandId)
          .eq("active", true)
          .order("name", { ascending: true});

        if (productsError) {
          throw productsError;
        }

        // Clean data to prevent circular refs and reduce payload size
        const cleanBrand = {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logo_url: brand.logo_url,
          description: brand.description,
        };

        const cleanProducts = (products || []).map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          image_url: p.image_url,
          base_price: p.base_price,
          currency: p.currency,
        }));

        return {
          content: [
            {
              type: "text",
              text: `Đã chọn thương hiệu "${brand.name}". Tìm thấy ${products?.length || 0} sản phẩm.`,
            },
          ],
          structuredContent: {
            brand: cleanBrand,
            products: cleanProducts,
            brandName: brand.name,
          },
        };
      } catch (error) {
        console.error("Error selecting brand:", error);
        return {
          content: [
            {
              type: "text",
              text: "Không thể tải thông tin thương hiệu. Vui lòng thử lại.",
            },
          ],
          structuredContent: { products: [] },
        };
      }
    }
  );

  // ============================================
  // Tool/Widget: Select Product
  // ============================================
  registerOpenAIWidget(
    server,
    {
      id: "select_product",
      title: "Chi Tiết Sản Phẩm",
      description: "Xem chi tiết sản phẩm và các tùy chọn mua hàng",
      templateUri: "ui://widget/product-detail.html",
      invoking: "Đang tải chi tiết sản phẩm...",
      invoked: "Chi tiết sản phẩm đã được tải!",
      html: readWidgetHtml("ProductDetail.html"),
      responseText: "Đây là thông tin chi tiết về sản phẩm.",
      inputSchema: selectProductSchema,
    },
    async (args: z.infer<typeof selectProductSchema>) => {
      try {
        // Fetch product details
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", args.productId)
          .single();

        if (productError || !product) {
          throw new Error("Product not found");
        }

        // Fetch brand info
        const { data: brand } = await supabase
          .from("brands")
          .select("name")
          .eq("id", product.brand_id)
          .single();

        // Fetch product variants
        const { data: variants } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", args.productId)
          .order("price", { ascending: true });

        // Clean data to prevent circular refs
        const cleanProduct = {
          id: product.id,
          brand_id: product.brand_id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          long_description: product.long_description,
          image_url: product.image_url,
          base_price: product.base_price,
          currency: product.currency,
          checkout_url: product.checkout_url,
        };

        const cleanVariants = (variants || []).map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          currency: v.currency,
          stock_status: v.stock_status,
          attributes: v.attributes,
        }));

        return {
          content: [
            {
              type: "text",
              text: `Chi tiết sản phẩm: ${product.name}`,
            },
          ],
          structuredContent: {
            product: cleanProduct,
            variants: cleanVariants,
            brandName: brand?.name,
          },
        };
      } catch (error) {
        console.error("Error selecting product:", error);
        return {
          content: [
            {
              type: "text",
              text: "Không thể tải thông tin sản phẩm. Vui lòng thử lại.",
            },
          ],
          structuredContent: {},
        };
      }
    }
  );

  // ============================================
  // Tool/Widget: Show Lead Form
  // ============================================
  registerOpenAIWidget(
    server,
    {
      id: "show_lead_form",
      title: "Gửi Thông Tin Tư Vấn",
      description: "Hiển thị form để thu thập thông tin khách hàng tiềm năng",
      templateUri: "ui://widget/lead-form.html",
      invoking: "Đang chuẩn bị form...",
      invoked: "Form đã sẵn sàng!",
      html: readWidgetHtml("LeadForm.html"),
      responseText: "Vui lòng điền thông tin để nhận tư vấn miễn phí.",
      inputSchema: showLeadFormSchema,
    },
    async (args: z.infer<typeof showLeadFormSchema>) => {
      try {
        // Fetch brand info
        const { data: brand } = await supabase
          .from("brands")
          .select("name")
          .eq("id", args.brandId)
          .single();

        // Fetch product info if provided
        let productName;
        if (args.productId) {
          const { data: product } = await supabase
            .from("products")
            .select("name")
            .eq("id", args.productId)
            .single();
          productName = product?.name;
        }

        return {
          content: [
            {
              type: "text",
              text: "Vui lòng điền thông tin để nhận tư vấn.",
            },
          ],
          structuredContent: {
            brandId: args.brandId,
            brandName: brand?.name,
            productId: args.productId,
            productName,
            variantId: args.variantId,
          },
        };
      } catch (error) {
        console.error("Error showing lead form:", error);
        return {
          content: [
            {
              type: "text",
              text: "Không thể hiển thị form. Vui lòng thử lại.",
            },
          ],
          structuredContent: {},
        };
      }
    }
  );

  // ============================================
  // Tool: Submit Lead (non-widget tool)
  // ============================================
  registerOpenAIWidget(
    server,
    {
      id: "submit_lead",
      title: "Lưu Thông Tin Lead",
      description: "Lưu thông tin khách hàng tiềm năng vào database",
      templateUri: "ui://tool/submit-lead",
      invoking: "Đang gửi thông tin...",
      invoked: "Thông tin đã được lưu!",
      html: `<div style="padding: 20px; text-align: center; font-family: system-ui;">
        <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
        <h2 style="color: #059669;">Gửi thành công!</h2>
        <p>Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.</p>
      </div>`,
      responseText: "Thông tin của bạn đã được gửi thành công!",
      inputSchema: leadPayloadSchema,
    },
    async (input: z.infer<typeof leadPayloadSchema>) => {
      try {
        const { error } = await supabase.from("leads").insert({
          brand_id: input.brand_id,
          product_id: input.product_id || null,
          payload: input.payload,
          consent: input.consent,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error inserting lead:", error);
          throw error;
        }

        return {
          content: [
            {
              type: "text",
              text: "Thông tin của bạn đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to submit lead:", error);
        return {
          content: [
            {
              type: "text",
              text: "Không thể gửi thông tin. Vui lòng thử lại sau.",
            },
          ],
        };
      }
    }
  );

  // ============================================
  // Tool: Track Event
  // ============================================
  registerOpenAIWidget(
    server,
    {
      id: "track_event",
      title: "Ghi Sự Kiện",
      description: "Ghi lại sự kiện tương tác của người dùng (search, click)",
      templateUri: "ui://tool/track-event",
      invoking: "Đang ghi sự kiện...",
      invoked: "Sự kiện đã được ghi nhận!",
      html: `<div style="padding: 10px; font-family: system-ui; font-size: 14px; color: #666;">
        Sự kiện đã được ghi nhận.
      </div>`,
      responseText: "Đã ghi nhận sự kiện.",
      inputSchema: trackEventSchema,
    },
    async (args: z.infer<typeof trackEventSchema>) => {
      try {
        const table = args.type === "search" ? "search_events" : "click_events";

        const { error } = await supabase.from(table).insert({
          ...args.payload,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`Error inserting ${args.type} event:`, error);
          throw error;
        }

        return {
          content: [
            {
              type: "text",
              text: "Đã ghi nhận sự kiện.",
            },
          ],
        };
      } catch (error) {
        console.error("Failed to track event:", error);
        // Don't fail the user experience if tracking fails
        return {
          content: [
            {
              type: "text",
              text: "Đã xử lý yêu cầu.",
            },
          ],
        };
      }
    }
  );

  return server;
}

// ============================================
// Start HTTP Server
// ============================================
const port = parseInt(process.env.PORT || "8000", 10);

// Wrap server startup with error handling
try {
  const httpServer = startOpenAIWidgetHttpServer({
    port,
    serverFactory: createServer,
  });

  console.log(`🚀 MCP Server started on port ${port}`);
  console.log(`📡 Ready to accept connections from ChatGPT`);
  console.log(`🔗 Server URL: http://localhost:${port}/mcp`);

  // Prevent process from exiting on unhandled rejections (SDK bug workaround)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - SDK close() bug causes unhandled rejections
  });

  // Graceful shutdown - DISABLED due to SDK close() bug causing infinite loop
  // process.on('SIGTERM', () => {
  //   console.log('SIGTERM received, shutting down gracefully...');
  //   httpServer?.close(() => {
  //     console.log('Server closed');
  //     process.exit(0);
  //   });
  // });

  // process.on('SIGINT', () => {
  //   console.log('SIGINT received, shutting down gracefully...');
  //   httpServer?.close(() => {
  //     console.log('Server closed');
  //     process.exit(0);
  //   });
  // });

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
