import React from 'react';
import { ArrowDown } from 'lucide-react';

type AssetGroupAsset = {
  id?: string | number;
  name?: string;
  type?: string;
  fieldType?: string;
  status?: string;
  performanceLabel?: string;
  assetGroupId?: string | number;
  assetGroupName?: string;
  assetGroupStatus?: string;
  text?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  lastUpdated?: string;
  metrics: {
    clicks: number;
    impressions: number;
    conversions: number;
    conversionValue: number;
    cost: number;
  };
};

interface AssetGroupTableProps {
  assets: AssetGroupAsset[];
  loading?: boolean;
}

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString() : '0';

const formatCurrency = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      })
    : '$0.00';

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusColor = (status?: string) => {
  if (status === 'ENABLED') return 'bg-green-500';
  if (status === 'PAUSED') return 'bg-amber-500';
  if (status === 'REMOVED') return 'bg-gray-400';
  return 'bg-gray-300';
};

const LoadingRows = () => (
  <tbody>
    {[...Array(5)].map((_, idx) => (
      <tr key={idx} className="border-b border-gray-100">
        <td className="py-4 px-4">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse" />
        </td>
        <td className="py-4 px-2">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </td>
        <td className="py-4 px-4">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
        </td>
        <td className="py-4 px-4">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        </td>
        <td className="py-4 px-4">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </td>
        <td className="py-4 px-4">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse" />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse" />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse" />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse" />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse" />
        </td>
      </tr>
    ))}
  </tbody>
);

export default function AssetGroupTable({
  assets,
  loading = false,
}: AssetGroupTableProps) {
  const hasAssets = assets && assets.length > 0;

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden font-sans">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Asset Group Assets
          </h3>
          <p className="text-xs text-gray-500">
            Live data pulled from your Google Ads account
          </p>
        </div>
        <div className="text-xs text-gray-400">
          Last 30 days · Test account ready
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
          <thead>
            <tr className="border-b border-gray-300 bg-white text-xs text-gray-600 font-medium">
              <th className="py-3 px-4 w-12 text-center">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></div>
              </th>
              <th className="py-3 px-2 font-medium">Asset</th>
              <th className="py-3 px-4 font-medium flex items-center gap-1 cursor-pointer hover:bg-gray-50">
                Level <ArrowDown className="w-3.5 h-3.5" />
              </th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Asset type</th>
              <th className="py-3 px-4 font-medium">Last updated</th>
              <th className="py-3 px-4 font-medium text-right">Conversions</th>
              <th className="py-3 px-4 font-medium text-right">Conv. value</th>
              <th className="py-3 px-4 font-medium text-right">Impr.</th>
              <th className="py-3 px-4 font-medium text-right">Clicks</th>
              <th className="py-3 px-4 font-medium text-right">Cost</th>
            </tr>
          </thead>

          {loading ? (
            <LoadingRows />
          ) : !hasAssets ? (
            <tbody>
              <tr>
                <td
                  colSpan={11}
                  className="py-10 px-4 text-center text-gray-400 text-sm"
                >
                  No asset data found for this account.
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="text-sm text-gray-700">
              {assets.map((asset, index) => {
                const indicator = getStatusColor(asset.status);
                const dims =
                  asset.imageWidth && asset.imageHeight
                    ? `${asset.imageWidth} × ${asset.imageHeight}`
                    : null;

                return (
                  <tr
                    key={String(asset.id ?? index)}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <td className="py-4 px-4 align-top text-center pt-5">
                      <div
                        className={`w-2.5 h-2.5 rounded-full inline-block ${indicator}`}
                      ></div>
                    </td>

                    <td className="py-4 px-2 align-top max-w-[280px] whitespace-normal">
                      <div className="flex items-center gap-3">
                        {asset.imageUrl ? (
                          <>
                            <img
                              src={asset.imageUrl}
                              alt={asset.name || 'Asset preview'}
                              className="object-contain bg-gray-100 border border-gray-200"
                              style={{ maxHeight: '48px', maxWidth: '80px' }}
                            />
                            <div className="flex flex-col">
                              <span className="text-gray-800 leading-snug">
                                {asset.name || 'Image asset'}
                              </span>
                              {dims && (
                                <span className="text-gray-500 text-xs">
                                  {dims}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-800 leading-snug">
                            {asset.text || asset.name || 'Text asset'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top pt-5 text-gray-600">
                      {asset.assetGroupName || 'Asset group'}
                    </td>

                    <td className="py-4 px-4 align-top pt-4">
                      <div className="flex flex-col text-gray-600 text-xs">
                        <span className="font-medium">
                          {asset.status || 'Unknown'}
                        </span>
                        {asset.performanceLabel && (
                          <span className="text-gray-500">
                            {asset.performanceLabel}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top pt-5 text-gray-600">
                      {asset.fieldType || asset.type || '—'}
                    </td>

                    <td className="py-4 px-4 align-top pt-4 text-xs text-gray-600">
                      {formatDateTime(asset.lastUpdated)}
                    </td>

                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {formatNumber(asset.metrics?.conversions || 0)}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {formatCurrency(asset.metrics?.conversionValue || 0)}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {formatNumber(asset.metrics?.impressions || 0)}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {formatNumber(asset.metrics?.clicks || 0)}
                    </td>
                    <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">
                      {formatCurrency(asset.metrics?.cost || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
