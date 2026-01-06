import axios from "axios";
import moment from "moment";
import { join } from "path";
import { appendFile } from "node:fs/promises";
import { dlopen, FFIType, ptr } from "bun:ffi";

const TIMEZONEDB = "https://api.timezonedb.com/v2.1/get-time-zone?key=3A7UE88GSJR8&format=json&by=zone&zone=America/Sao_Paulo";
const __dirname = process.cwd();

const kernel32 = dlopen("kernel32.dll", {
  SetLocalTime: {
    args: [FFIType.ptr],
    returns: FFIType.i32
  }
});

type TimezoneResponse = {
  timestamp: number,
  formatted: string
};

type SYSTEMTIME = {
  wYear: number
  wMonth: number
  wDayOfWeek: number
  wDay: number
  wHour: number
  wMinute: number
  wSecond: number
  wMilliseconds: number
}

async function main() {
  try {
    const response = await axios.get<TimezoneResponse>(TIMEZONEDB);

    if (response.status === 200) {
      const data = response.data.formatted.split(" ");
      const date = data[0]!.split("-");
      const time = data[1]!.split(":");

      const systemtimePayload: SYSTEMTIME = {
        wYear: parseInt(date[0]!),
        wMonth: parseInt(date[1]!),
        wDayOfWeek: moment().day(),
        wDay: parseInt(date[2]!),
        wHour: parseInt(time[0]!),
        wMinute: parseInt(time[1]!),
        wSecond: parseInt(time[2]!),
        wMilliseconds: 0
      };

      const buffer = new ArrayBuffer(16);
      const view = new DataView(buffer);

      view.setUint16(0, systemtimePayload.wYear, true);
      view.setUint16(2, systemtimePayload.wMonth, true);
      view.setUint16(4, systemtimePayload.wDayOfWeek, true);
      view.setUint16(6, systemtimePayload.wDay, true);
      view.setUint16(8, systemtimePayload.wHour, true);
      view.setUint16(10, systemtimePayload.wMinute, true);
      view.setUint16(12, systemtimePayload.wSecond, true);
      view.setUint16(14, systemtimePayload.wMilliseconds, true);

      const success = kernel32.symbols.SetLocalTime(ptr(view));
      
      if (success === 0) {
        throw new Error("Failed to set system time. Are you running with sufficient privileges?");
      }
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const logPath = join(__dirname, "error.log");
      const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
      const errorMessage = `[${timestamp}] Axios Error: ${error.message}\n`;
      await appendFile(logPath, errorMessage);
      console.error("An Axios error occurred. Check error.log for details.");
    }
  }
}

await main();

/*
Tamanho,Cálculo,Tipo no Bun/JS,Capacidade (Decimal)
1 Byte, 1×8,    Uint8,         0 a 255
2 Bytes,2×8,    Uint16,        0 a 65.535
4 Bytes,4×8,    Uint32,        0 a 4.294.967.295
8 Bytes,8×8,    BigUint64,     Números astronômicos
*/
