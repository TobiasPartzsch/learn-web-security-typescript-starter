import { type Request, type Response, Router } from "express";
import { findApiKey } from "../auth/apiKeys.ts";
import { consumeApiKeyQuota } from "../auth/apiKeyUsage.ts";
import { getCurrentSession } from "../auth/sessions.ts";
import type { Dependencies } from "../dependencies.ts";
import {
  findOrderById,
  listAllOrders,
  listOrderItems,
  listOrdersForUser,
  type Order,
  type OrderItem,
} from "../orders/index.ts";
import { listPublicProducts, type Product } from "../products.ts";

import { type ApiKeyQuotaResponse, sendApiKeyQuotaExhausted, setApiKeyQuotaHeaders, toApiKeyQuotaResponse } from "./apiKeyQuota.ts";


type ProductResponse = {
  id: number;
  name: string;
  description: string;
  image_path: string;
  price_cents: number;
};

type OrderResponse = {
  id: number;
  status: Order["status"];
  total_cents: number;
  created_at: string;
};

type OrderItemResponse = {
  product_id: number;
  product_name: string;
  quantity: number;
  price_cents: number;
};

type WarehouseOrdersResponse = {
  integration: string;
  orders: OrderResponse[];
  quota: ApiKeyQuotaResponse;
};

type ProductsListResponse = { products: ProductResponse[] };
type OrderListResponse = { orders: OrderResponse[] };

type OrderDetailResponse = {
  order: OrderResponse;
  items: OrderItemResponse[];
};

type ApiError = { error: string };
type ApiResponse<T> = T | ApiError;


export function createApiRouter(deps: Dependencies): Router {
  const { db } = deps;
  const router = Router();

  router.get("/api/account/orders", (req: Request, res: Response<ApiResponse<OrderListResponse>>) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const orders = listOrdersForUser(db, current.user.id)
    res.json({ orders: orders.map(toOrderResponse) });
  });

  router.get("/api/orders/:id", (req: Request, res: Response<ApiResponse<OrderDetailResponse>>) => {
    const current = getCurrentSession(db, req.header("cookie"));
    if (!current) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId)) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = findOrderById(db, orderId);
    if (!order || order.user_id != current.user.id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json({ order: toOrderResponse(order), items: listOrderItems(db, order.id).map(toOrderItemResponse) });
  });

  router.get("/api/products", (_req: Request, res: Response<ApiResponse<ProductsListResponse>>) => {
    res.json({ products: listPublicProducts(db, deps.maxPublicProductResults).map(toProductResponse) });
  });

  router.get("/api/integrations/warehouse/orders", (req: Request, res: Response<ApiResponse<WarehouseOrdersResponse>>) => {
    const apiKey = findApiKey(db, req.header("x-api-key") ?? "");
    if (!apiKey) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    if (apiKey.scope !== "orders:read") {
      res.status(403).json({ error: "API key scope is not allowed" });
      return;
    }

    const quota = consumeApiKeyQuota(db, apiKey.id)
    if (!quota.allowed) {
      sendApiKeyQuotaExhausted(res, quota);
      return;
    }
    setApiKeyQuotaHeaders(res, quota)

    const orders = listAllOrders(db).map(toOrderResponse);

    res.json({
      integration: "Warehouse Fulfillment Integration",
      orders,
      quota: toApiKeyQuotaResponse(quota),
    });
  });

  return router;
}

function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    image_path: product.image_path,
    price_cents: product.price_cents,
  };
}

function toOrderResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    status: order.status,
    total_cents: order.total_cents,
    created_at: order.created_at,
  };
}

function toOrderItemResponse(orderItem: OrderItem): OrderItemResponse {
  return {
    product_id: orderItem.id,
    product_name: orderItem.product_name,
    quantity: orderItem.quantity,
    price_cents: orderItem.price_cents,
  };
}