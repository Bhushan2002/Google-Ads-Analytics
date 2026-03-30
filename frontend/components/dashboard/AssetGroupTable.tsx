import React from "react";
import { ArrowDown, Pencil } from "lucide-react";

interface AssetGroupTableProps {
  assets?: any[];
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(num >= 10_000 ? 0 : 1) + "k";
  if (num === 0) return "0";
  return num.toLocaleString();
}

function formatCurrency(micros: number): string {
  if (!micros || micros === 0) return "₹0.00";
  return `₹${Math.round(micros / 1_000_000).toFixed(2)}`;
}

function getAssetFieldTypeName(type: string | number): string {
  const types: Record<string, string> = {
    "1": "Unknown",
    "2": "Headline",
    "3": "Description",
    "4": "Mandatory ad text",
    "5": "Marketing image",
    "6": "Media bundle",
    "7": "Youtube video",
    "8": "Book on Google",
    "9": "Lead form",
    "10": "Promotion",
    "11": "Callout",
    "12": "Structured snippet",
    "13": "Sitelink",
    "14": "Mobile app",
    "15": "Hotel callout",
    "16": "Call",
    "17": "Price",
    "18": "Long headline",
    "19": "Business name",
    "20": "Square marketing image",
    "21": "Portrait marketing image",
    "22": "Logo",
    "23": "Landscape logo",
    "24": "Video",
    "25": "Call to action",
    "26": "Youtube short",
  };
  const key = String(type);
  if (types[key]) return types[key];

  return key.replace(/_/g, " ").toLowerCase();
}

export default function AssetGroupTable({ assets = [] }: AssetGroupTableProps) {
  const safeAssets = assets || [];

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden font-sans">
      {/* Horizontal scrolling wrapper for smaller screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-300 bg-white text-xs text-gray-600 font-medium">
              <th className="py-3 px-2 font-medium">Asset</th>
              <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-50">
                Level
              </th>
              <th className="py-3 px-4 font-medium">Performance</th>
              <th className="py-3 px-4 font-medium">Asset type</th>
              <th className="py-3 px-4 font-medium text-right">Conversions</th>
              <th className="py-3 px-4 font-medium text-right">Conv. value</th>
              <th className="py-3 px-4 font-medium text-right">Impr.</th>
              <th className="py-3 px-4 font-medium text-right">Clicks</th>
              <th className="py-3 px-4 font-medium text-right">Cost</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="text-sm text-gray-700">
            {safeAssets.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">
                  No asset data available
                </td>
              </tr>
            ) : (
              safeAssets.map((apiAsset, index) => {
                const isImage =
                  apiAsset.asset?.type === "IMAGE" ||
                  apiAsset.asset?.type === "3" ||
                  apiAsset.ad_group_ad_asset_view?.field_type === 5 ||
                  apiAsset.ad_group_ad_asset_view?.field_type === 20 ||
                  apiAsset.ad_group_ad_asset_view?.field_type === 21 ||
                  apiAsset.ad_group_ad_asset_view?.field_type === 22 ||
                  apiAsset.ad_group_ad_asset_view?.field_type === 23;
                const assetData = {
                  type: isImage ? "image" : "text",
                  text:
                    apiAsset.asset?.text_asset?.text ||
                    apiAsset.asset?.name ||
                    "Unknown Asset",
                  imgUrl: apiAsset.asset?.image_asset?.full_size?.url,
                  level: apiAsset.ad_group_ad_asset_view?.ad_group_ad
                    ? "Ad group"
                    : "Campaign",
                  status1: String(
                    apiAsset.ad_group_ad_asset_view?.performance_label || "",
                  ).toLowerCase(),
                  status2: apiAsset.status || "",
                  assetType: getAssetFieldTypeName(
                    apiAsset.ad_group_ad_asset_view?.field_type || "",
                  ),
                  conv: formatNumber(apiAsset.metrics?.conversions || 0),
                  convVal: formatNumber(
                    apiAsset.metrics?.conversions_value || 0,
                  ),
                  impr: formatNumber(apiAsset.metrics?.impressions || 0),
                  clicks: formatNumber(apiAsset.metrics?.clicks || 0),
                  cost: formatCurrency(apiAsset.metrics?.cost_micros || 0),
                };

                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Asset Content (Text or Image) */}
                    <td className="py-4 px-2 align-top max-w-[280px] whitespace-normal">
                      <div className="flex items-center gap-2">
                        {assetData.type === "text" ? (
                          <span className="text-gray-800 leading-snug">
                            {assetData.text}
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <img
                              src={assetData.imgUrl}
                              alt="Asset preview"
                              className="object-contain bg-gray-100 border border-gray-200"
                              style={{ maxHeight: "48px", maxWidth: "80px" }}
                            />
                          </div>
                        )}
                       
                      </div>
                    </td>

                    {/* Other Columns */}
                    <td className="py-4 px-4 align-top pt-5 text-gray-600">
                      {assetData.level}
                    </td>

                    <td className="py-4 px-4 align-top pt-4">
                      <div className="flex flex-col text-gray-600 text-xs">
                        <span className="capitalize">{assetData.status1}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top pt-5 text-gray-600 capitalize">
                      {assetData.assetType}
                    </td>

                    {/* Metrics */}
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {assetData.conv}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {assetData.convVal}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {assetData.impr}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {assetData.clicks}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {assetData.cost}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
