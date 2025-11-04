export const getFFmpegCommand = (inputFilePath, outputDir, width, height) => {
  const commands = [];

  // 360p
  if (width >= 640 && height >= 360) {
    commands.push(
      `ffmpeg -i ${inputFilePath} \
        -vf "scale=w=640:h=360:force_original_aspect_ratio=decrease" \
        -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 \
        -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod \
        -b:v 800k -maxrate 856k -bufsize 1200k \
        -hls_segment_filename "${outputDir}/output_360p_%03d.ts" \
        -hls_flags independent_segments \
        "${outputDir}/output_360p.m3u8"`
    );
  }

  // 720p
  if (width >= 1280 && height >= 720) {
    commands.push(
      `ffmpeg -i ${inputFilePath} \
        -vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease" \
        -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 \
        -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod \
        -b:v 2800k -maxrate 2996k -bufsize 4200k \
        -hls_segment_filename "${outputDir}/output_720p_%03d.ts" \
        -hls_flags independent_segments \
        "${outputDir}/output_720p.m3u8"`
    );
  }

  // 1080p
  if (width >= 1920 && height >= 1080) {
    commands.push(
      `ffmpeg -i ${inputFilePath} \
    -vf "scale=w=1920:h=1080:force_original_aspect_ratio=decrease" \
    -c:a aac -ar 48000 -c:v h264 -profile:v main -crf 20 -sc_threshold 0 \
    -g 48 -keyint_min 48 -hls_time 4 -hls_playlist_type vod \
    -b:v 5000k -maxrate 5350k -bufsize 7500k \
    -hls_segment_filename "${outputDir}/output_1080p_%03d.ts" \
    -hls_flags independent_segments \
    "${outputDir}/output_1080p.m3u8"`
    );
  }

  return commands;
};
