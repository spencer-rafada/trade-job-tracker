"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TradeInput = {
  trade_name: string;
  department_id?: string;
  description?: string;
};

/**
 * Get all trades
 */
export async function getAllTrades() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("trade_name", { ascending: true });

  if (error) {
    console.error("Error fetching trades:", error);
    return [];
  }

  return data;
}

/**
 * Get trade by ID
 */
export async function getTradeById(tradeId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .single();

  if (error) {
    console.error("Error fetching trade:", error);
    return null;
  }

  return data;
}

/**
 * Create a new trade (admin only)
 */
export async function createTrade(tradeData: TradeInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .insert(tradeData)
    .select()
    .single();

  if (error) {
    console.error("Error creating trade:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/trades");
  revalidatePath("/admin/crews");
  revalidatePath("/");

  return { success: true, data };
}

/**
 * Update trade (admin only)
 */
export async function updateTrade(tradeId: string, tradeData: TradeInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("trades")
    .update(tradeData)
    .eq("id", tradeId)
    .select()
    .single();

  if (error) {
    console.error("Error updating trade:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/trades");
  revalidatePath("/admin/crews");
  revalidatePath("/");

  return { success: true, data };
}

/**
 * Delete trade (admin only)
 * Will fail if trade is assigned to any crews (RESTRICT constraint)
 */
export async function deleteTrade(tradeId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("trades").delete().eq("id", tradeId);

  if (error) {
    console.error("Error deleting trade:", error);
    // Check if it's a foreign key constraint error
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete trade that is assigned to crews. Please reassign or remove crews first.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/trades");
  revalidatePath("/admin/crews");
  revalidatePath("/");

  return { success: true };
}
