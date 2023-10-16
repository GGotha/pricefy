"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import api from "@/services/brapi";
import { format } from "date-fns";
import localePTBr from "date-fns/locale/pt-BR";
import { ArrowDown, ArrowUp, TrashIcon } from "lucide-react";
import Image from "next/image";
import { parseCookies, setCookie } from "nookies";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";

export type TStock = {
  logourl: string;
  regularMarketChangePercent: number;
  regularMarketPrice: number;
  symbol: string;
  updatedAt: string;
};

export default function Home() {
  const cookies = parseCookies();
  const storage = cookies.stocks;

  const [inputStock, setInputStock] = useState("");
  const [stock, setStock] = useState<TStock | null>(null);
  const [stocks, setStocks] = useState<TStock[]>(
    storage ? JSON.parse(storage) : null
  );

  const findStock = useCallback(async () => {
    if (!inputStock) return;
    if (stocks.find((stock) => stock.symbol === inputStock)) return;

    try {
      const response = await api.get(`quote/${inputStock}`);

      setStocks((prev) => [...prev, response.data.results[0]]);
    } catch (err: any) {
      if (err.response.status === 404) {
        return enqueueSnackbar("Stock not found", { variant: "warning" });
      }

      return enqueueSnackbar("Internal Server Error", { variant: "error" });
    }
  }, [inputStock, stocks]);

  useEffect(() => {
    if (stocks.length === 0) return;

    setCookie(null, "stocks", JSON.stringify(stocks), {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
  }, [stocks]);

  const updatedAt = useCallback(
    (date: string) => {
      if (!date) return null;

      return format(new Date(date), "dd/MM/yyyy HH:mm:ss", {
        locale: localePTBr,
      });
    },
    [stock]
  );

  const removeStock = useCallback(
    (symbol: string) => {
      const stockIndex = stocks.findIndex(
        (stockRemove) => stockRemove.symbol === symbol
      );
      if (stockIndex === -1) return;

      setStocks((prev) => prev.splice(stockIndex, 1));
    },
    [stocks]
  );

  return (
    <>
      <div className="flex justify-center items-center h-[calc(100vh-55px)] gap-10">
        <div className="flex flex-col gap-10">
          <div className="flex flex-row gap-2">
            <Input onChange={(e) => setInputStock(e.target.value)} />
            <Button variant="outline" onClick={findStock}>
              Search
            </Button>
          </div>
          {!stocks ? null : (
            <div className="flex flex-wrap gap-5">
              {stocks?.map((stock) => (
                <Card key={stock.symbol}>
                  <CardHeader>
                    <CardTitle>
                      <div className="flex justify-between">
                        {stock.symbol}

                        <TrashIcon
                          onClick={() => removeStock(stock.symbol)}
                          color="white"
                          className="cursor-pointer"
                        />
                      </div>
                    </CardTitle>
                    {stock.logourl ? (
                      <Image
                        src={stock.logourl}
                        alt="image"
                        width={100}
                        height={100}
                      />
                    ) : null}
                  </CardHeader>
                  <CardContent className="w-auto">
                    <div className="flex justify-between items-center w-auto">
                      <p>
                        {stock.regularMarketPrice
                          ? "R$ " +
                            new Intl.NumberFormat("pt-br").format(
                              stock?.regularMarketPrice
                            )
                          : null}
                      </p>
                      <div className="flex justify-center items-center gap-1">
                        {stock.regularMarketChangePercent > 0 ? (
                          <ArrowUp color="green" />
                        ) : (
                          <ArrowDown color="red" />
                        )}
                        <p>
                          {stock.regularMarketChangePercent
                            ? parseFloat(
                                stock.regularMarketChangePercent.toString()
                              ).toFixed(2)
                            : null}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {stock.updatedAt
                      ? "Atualizado às: " + updatedAt(stock.updatedAt)
                      : null}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
