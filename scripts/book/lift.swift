// Tách nền ảnh bằng Vision của macOS (tính năng "nhấc chủ thể" có sẵn từ macOS 14), không cần tải model.
//   swiftc -O scripts/book/lift.swift -o <đường dẫn>/lift
//   lift <ảnh vào> <ảnh PNG ra>   → PNG nền trong suốt, giữ nguyên khổ ảnh gốc
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3 else {
    FileHandle.standardError.write("cách dùng: lift <vào> <ra.png>\n".data(using: .utf8)!)
    exit(2)
}
guard let input = CIImage(contentsOf: URL(fileURLWithPath: args[1]), options: [.applyOrientationProperty: true]) else {
    FileHandle.standardError.write("không đọc được ảnh\n".data(using: .utf8)!)
    exit(1)
}
let handler = VNImageRequestHandler(ciImage: input)
let request = VNGenerateForegroundInstanceMaskRequest()
do {
    try handler.perform([request])
    guard let result = request.results?.first, !result.allInstances.isEmpty else {
        FileHandle.standardError.write("không tìm thấy chủ thể\n".data(using: .utf8)!)
        exit(3)
    }
    let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
    let ci = CIImage(cvPixelBuffer: buffer)
    let ctx = CIContext()
    guard let cg = ctx.createCGImage(ci, from: ci.extent) else { exit(1) }
    let rep = NSBitmapImageRep(cgImage: cg)
    guard let png = rep.representation(using: .png, properties: [:]) else { exit(1) }
    try png.write(to: URL(fileURLWithPath: args[2]))
} catch {
    FileHandle.standardError.write("lỗi: \(error)\n".data(using: .utf8)!)
    exit(1)
}
