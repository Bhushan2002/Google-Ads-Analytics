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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-[500px] font-sans">
      <div className="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Assets</h3>
        <p className="text-xs text-gray-400 mt-1">Top assets by metrics for the selected account</p>
      </div>

      {safeAssets.length === 0 ? (
        <div className="p-8 text-center flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No asset data available</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10 shadow-sm">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Asset</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Level</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Performance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Asset type</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Conv.</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Conv. value</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Impr.</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Clicks</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody>
              {safeAssets.map((apiAsset, index) => {
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
                    apiAsset.ad_group_ad_asset_view?.performance_label || ""
                  ).toLowerCase(),
                  status2: apiAsset.status || "",
                  assetType: getAssetFieldTypeName(
                    apiAsset.ad_group_ad_asset_view?.field_type || ""
                  ),
                  conv: formatNumber(apiAsset.metrics?.conversions || 0),
                  convVal: formatNumber(apiAsset.metrics?.conversions_value || 0),
                  impr: formatNumber(apiAsset.metrics?.impressions || 0),
                  clicks: formatNumber(apiAsset.metrics?.clicks || 0),
                  cost: apiAsset.metrics?.cost_micros || 0,
                };

                return (
                  <tr
                    key={index}
                    className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors duration-150 group"
                  >
                    <td className="py-3 px-4 align-top max-w-[280px] whitespace-normal">
                      <div className="flex items-center gap-2">
                        {assetData.type === "text" ? (
                          <span className="font-medium text-gray-800 leading-snug">
                            {assetData.text}
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <img
                              src={assetData.imgUrl}
                              alt="Asset preview"
                              className="object-contain bg-gray-50 border border-gray-100 rounded-sm"
                              style={{ maxHeight: "40px", maxWidth: "60px" }}
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top text-gray-700 font-medium">
                      {assetData.level}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-col text-gray-600">
                        <span className="capitalize text-xs font-semibold px-2 py-1 rounded-full bg-gray-50 inline-block w-fit">
                          {assetData.status1}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top text-gray-700 font-medium capitalize">
                      {assetData.assetType}
                    </td>
                    <td className="py-3 px-4 align-top text-right font-medium text-gray-700">
                      {assetData.conv}
                    </td>
                    <td className="py-3 px-4 align-top text-right font-medium text-gray-700">
                      {assetData.convVal}
                    </td>
                    <td className="py-3 px-4 align-top text-right font-medium text-gray-700">
                      {assetData.impr}
                    </td>
                    <td className="py-3 px-4 align-top text-right font-medium text-gray-700">
                      {assetData.clicks}
                    </td>
                    <td className="py-3 px-4 align-top text-right font-medium text-gray-700">
                      ₹{assetData.cost}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
