import React from 'react';
import { ArrowDown, Pencil } from 'lucide-react';

export default function AssetGroupTable() {
  const assets = [
    { type: 'text', text: 'AI Content Creation Tool', level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Headline', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'text', text: 'Social Media Marketing Tool', level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Headline', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'text', text: 'Creatosaurus', editable: true, level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Headline', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'text', text: 'AI Content Creation & Social Media Marketing Tool', level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Long headline', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'text', text: 'Creatosaurus helps eliminate the busywork, so you can focus on storytelling.', level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Description', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'image', imgUrl: 'https://placehold.co/100x100/e2e8f0/64748b?text=Img', dims: '856 × 856', level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Square image', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'image', imgUrl: 'https://placehold.co/160x85/e2e8f0/64748b?text=Img', dims: '1640 × 856', level: 'Asset group', status1: 'Pending', status2: 'Under review', assetType: 'Horizontal image', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'text', text: 'Creatosaurus', level: 'Campaign', status1: 'Pending', status2: 'Under review', assetType: 'Business name', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
    { type: 'image', imgUrl: 'https://placehold.co/100x100/1e293b/ffffff?text=Logo', dims: '140 × 140', level: 'Campaign', status1: 'Pending', status2: 'Under review', assetType: 'Logo', date: 'Mar 31, 2026,', time: '12:01 AM', conv: '0.00', convVal: '0.00', impr: '0', clicks: '0', cost: '₹0.00' },
  ];

  return (
    <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden font-sans">
      {/* Horizontal scrolling wrapper for smaller screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
          {/* Table Header */}
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

          {/* Table Body */}
          <tbody className="text-sm text-gray-700">
            {assets.map((asset, index) => (
              <tr 
                key={index} 
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors group"
              >
                {/* Status Dot */}
                <td className="py-4 px-4 align-top text-center pt-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block"></div>
                </td>

                {/* Asset Content (Text or Image) */}
                <td className="py-4 px-2 align-top max-w-[280px] whitespace-normal">
                  <div className="flex items-center gap-2">
                    {asset.type === 'text' ? (
                      <span className="text-gray-800 leading-snug">{asset.text}</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <img 
                          src={asset.imgUrl} 
                          alt="Asset preview" 
                          className="object-contain bg-gray-100 border border-gray-200"
                          style={{ maxHeight: '48px', maxWidth: '80px' }}
                        />
                        <span className="text-gray-500 text-xs">{asset.dims}</span>
                      </div>
                    )}
                    {/* Optional Edit Icon */}
                    {asset.editable && (
                      <Pencil className="w-3.5 h-3.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    )}
                  </div>
                </td>

                {/* Other Columns */}
                <td className="py-4 px-4 align-top pt-5 text-gray-600">{asset.level}</td>
                
                <td className="py-4 px-4 align-top pt-4">
                  <div className="flex flex-col text-gray-600 text-xs">
                    <span>{asset.status1}</span>
                    <span>{asset.status2}</span>
                  </div>
                </td>
                
                <td className="py-4 px-4 align-top pt-5 text-gray-600">{asset.assetType}</td>
                
                <td className="py-4 px-4 align-top pt-4 text-xs text-gray-600">
                  <div className="flex flex-col">
                    <span>{asset.date}</span>
                    <span>{asset.time}</span>
                  </div>
                </td>
                
                {/* Metrics */}
                <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">{asset.conv}</td>
                <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">{asset.convVal}</td>
                <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">{asset.impr}</td>
                <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">{asset.clicks}</td>
                <td className="py-4 px-4 align-top pt-5 text-right text-gray-600">{asset.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}