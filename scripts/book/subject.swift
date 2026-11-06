// Tìm vật chính trong ảnh bằng Vision của macOS (nhấc chủ thể + vùng nổi bật), không cần model.
//   swiftc -O scripts/book/subject.swift -o <đường dẫn>/subject
//   subject <ảnh 1> <ảnh 2> …  → mỗi ảnh một dòng JSON:
//   {"file", "a": rộng/cao, "fg": [x0,y0,x1,y1] khung chủ thể, "sal": [x0,y0,x1,y1] khung vùng nổi bật}, tỉ lệ 0..1, gốc trên-trái
import CoreImage
import Foundation
import Vision

func r3(_ v: Double) -> Double { (v * 1000).rounded() / 1000 }
for file in CommandLine.arguments.dropFirst() {
    guard let img = CIImage(contentsOf: URL(fileURLWithPath: file), options: [.applyOrientationProperty: true]) else { continue }
    let handler = VNImageRequestHandler(ciImage: img)
    let fgReq = VNGenerateForegroundInstanceMaskRequest()
    let salReq = VNGenerateObjectnessBasedSaliencyImageRequest()
    try? handler.perform([fgReq, salReq])
    var out: [String: Any] = ["file": file, "a": r3(Double(img.extent.width / img.extent.height))]
    if let res = fgReq.results?.first, !res.allInstances.isEmpty {
        let buf = res.instanceMask
        CVPixelBufferLockBaseAddress(buf, .readOnly)
        let w = CVPixelBufferGetWidth(buf), h = CVPixelBufferGetHeight(buf), row = CVPixelBufferGetBytesPerRow(buf)
        let p = CVPixelBufferGetBaseAddress(buf)!.assumingMemoryBound(to: UInt8.self)
        var x0 = w, y0 = h, x1 = -1, y1 = -1, n = 0
        for y in 0..<h { for x in 0..<w where p[y * row + x] != 0 { n += 1; x0 = min(x0, x); x1 = max(x1, x); y0 = min(y0, y); y1 = max(y1, y) } }
        CVPixelBufferUnlockBaseAddress(buf, .readOnly)
        if x1 >= 0 { out["fg"] = [r3(Double(x0) / Double(w)), r3(Double(y0) / Double(h)), r3(Double(x1 + 1) / Double(w)), r3(Double(y1 + 1) / Double(h))]; out["fgArea"] = r3(Double(n) / Double(w * h)) }
    }
    if let o = salReq.results?.first?.salientObjects, !o.isEmpty {
        var bx = o[0].boundingBox
        for s in o.dropFirst() { bx = bx.union(s.boundingBox) }
        out["sal"] = [r3(Double(bx.minX)), r3(Double(1 - bx.maxY)), r3(Double(bx.maxX)), r3(Double(1 - bx.minY))]
    }
    let d = try! JSONSerialization.data(withJSONObject: out, options: [.sortedKeys])
    print(String(data: d, encoding: .utf8)!)
}
