import { createKhushuRepository } from "@alrisali/db-user/khushu";
import type { KhushuRepository } from "@alrisali/db-user/khushu";
import type { Khushu } from "@alrisali/domain/khushu";
import type { Salah } from "@alrisali/domain/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Temporal } from "temporal-polyfill";

import { queryClient } from "@/shared/lib/orpc";
import {
  getUserDatabase,
  USER_DATA_QUERY_KEY,
} from "@/shared/lib/user-database";

const KHUSHU_QUERY_KEY = [...USER_DATA_QUERY_KEY, "khushu"];

const khushuRepository = async (): Promise<KhushuRepository> => {
  const { db } = await getUserDatabase();
  return createKhushuRepository(db);
};

/** Every Khushu rating, by date then the day's Salah order. */
export const useKhushuEntries = () =>
  useQuery({
    queryKey: KHUSHU_QUERY_KEY,
    queryFn: async (): Promise<Khushu[]> => {
      const repository = await khushuRepository();
      return repository.entries();
    },
  });

/** Rates or re-rates one Salah's Khushu. */
export const useSaveKhushu = () =>
  useMutation({
    mutationFn: async (rating: Khushu): Promise<Khushu> => {
      const repository = await khushuRepository();
      return repository.save({
        ...rating,
        today: Temporal.Now.plainDateISO(),
        at: new Date(),
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: KHUSHU_QUERY_KEY });
    },
  });

/** Removes one Salah's Khushu. */
export const useRemoveKhushu = () =>
  useMutation({
    mutationFn: async (key: {
      date: Temporal.PlainDate;
      salah: Salah;
    }): Promise<void> => {
      const repository = await khushuRepository();
      await repository.remove(key);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: KHUSHU_QUERY_KEY });
    },
  });
