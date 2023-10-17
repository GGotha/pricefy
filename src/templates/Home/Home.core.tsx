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
import {
  ArrowDown,
  ArrowUp,
  LoaderIcon,
  RefreshCwIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";

export type TStock = {
  logourl: string;
  regularMarketChangePercent: number;
  regularMarketPrice: number;
  symbol: string;
  updatedAt: string;
};

const FAVORITE_STOCKS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "BBAS3",
  "MXRF11",
  "HGLG11",
  "IRDM11",
  "VGIP11",
  "BTLG11",
  "VRTA11",
];

export default function Home() {
  const cookies = parseCookies();
  const storage = cookies.stocks;

  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [inputStock, setInputStock] = useState("");
  const [stock, setStock] = useState<TStock | null>(null);
  const [stocks, setStocks] = useState<TStock[]>(
    storage ? JSON.parse(storage) : null
  );

  const findStock = useCallback(async () => {
    if (!inputStock) return;
    if (stocks?.find((stock) => stock.symbol === inputStock)) return;

    try {
      const response = await api.get(`quote/${inputStock}`);

      if (!stocks) {
        return setStocks([response.data.results[0]]);
      }

      setStocks([...stocks, response.data.results[0]]);
    } catch (err: any) {
      if (err.response.status === 404) {
        return enqueueSnackbar("Stock not found", { variant: "warning" });
      }

      return enqueueSnackbar("Internal Server Error", { variant: "error" });
    }
  }, [inputStock, stocks]);

  const refresh = useCallback(async () => {
    if (!stocks) return;

    let stocksRefreshed: TStock[] = [];

    await Promise.all(
      stocks.map(async (stock) => {
        setLoadingRefresh(true);

        const response = await api.get(`quote/${stock.symbol}`);

        stocksRefreshed.push(response.data.results[0]);
      })
    );

    setLoadingRefresh(false);
    setStocks(stocksRefreshed);
  }, [stocks]);

  useEffect(() => {
    console.log("stocks", stocks);

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
    (stock: TStock) => {
      const stockIndex = stocks.indexOf(stock);

      if (stockIndex === -1) return;

      const newStocks = stocks.filter((stock, index) => index !== stockIndex);

      setStocks(newStocks);
    },
    [stocks]
  );

  return (
    <>
      <div className="flex flex-col gap-5">
        <div className="flex flex-row gap-2">
          <Input onChange={(e) => setInputStock(e.target.value)} />
          <Button variant="outline" onClick={findStock}>
            Search
          </Button>
        </div>
        <Button variant="outline" onClick={refresh}>
          Refresh
          {!loadingRefresh ? null : (
            <RefreshCwIcon className="ml-2 animate-spin" />
          )}
        </Button>
      </div>
      <div className="flex justify-center items-center h-[calc(100vh-292px)] gap-10">
        <div className="flex flex-col gap-10">
          {!stocks ? null : (
            <div className="flex flex-wrap gap-5">
              {stocks?.map((stock, index) => (
                <Card
                  key={stock.symbol}
                  className="min-w-[300px] hover:scale-110 transition duration-500 cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle>
                      <div className="flex justify-between">
                        {stock.symbol}

                        <TrashIcon
                          onClick={() => removeStock(stock)}
                          color="white"
                          className="cursor-pointer"
                        />
                      </div>
                    </CardTitle>
                    {stock.logourl ? (
                      <Image
                        src={stock.logourl}
                        alt="image-ticker"
                        width={100}
                        height={100}
                      />
                    ) : (
                      <Image
                        src="/assets/fii--big.svg"
                        alt="image-ticker"
                        width={100}
                        height={100}
                      />
                    )}
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
                      : "Atualizado às: ?"}
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
