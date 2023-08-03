"use client"
import { S3 } from "aws-sdk";
import { MotionValue, motion, useMotionValue, useSpring } from "framer-motion";
import Head from "next/head";
import { ChangeEventHandler, MouseEventHandler, useEffect, useState } from "react";
import { s3 } from "../../aws-config";


function ProgressBar({ value }: { value: MotionValue<number> }) {
  const width = useSpring(value, { damping: 20 });
  return (
      <motion.div className="flex h-6 w-full flex-row items-start justify-start">
          <motion.div
              className="h-full w-full bg-green-500"
              style={{ scaleX: width, originX: 0 }}
              transition={{ ease: 'easeIn' }}
          />
      </motion.div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<S3.ManagedUpload | null>(null);
  const progress = useMotionValue(0);

  useEffect(() => {
      return upload?.abort();
  }, []);

  useEffect(() => {
      progress.set(0);
      setUpload(null);
  }, [file]);

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      e.preventDefault();
      setFile(e.target.files![0]);
  };

  const handleUpload: MouseEventHandler<HTMLButtonElement> = async (e) => {
      e.preventDefault();
      if (!file) return;
      const params = {
          // Bucket: process.env.PUBLIC_S3_BUCKET_NAME as string,
          Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME as string,
          Key: file.name,
          Body: file,
      };
      console.log(params);

      try {
          const upload = s3.upload(params);
          setUpload(upload);
          upload.on('httpUploadProgress', (p) => {
              console.log(p.loaded / p.total);
              progress.set(p.loaded / p.total);
          });
          await upload.promise();
          console.log(`File uploaded successfully: ${file.name}`);
      } catch (err) {
          console.error(err);
      }
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
      e.preventDefault();
      if (!upload) return;
      upload.abort();
      progress.set(0);
      setUpload(null);
  };
  return (
      <div className="dark flex min-h-screen w-full items-center justify-center">
          <Head>
              <title>Hello World!</title>
              <link rel="icon" href="/favicon.ico" />
          </Head>
          <main>
              <form className="flex flex-col gap-4 rounded bg-stone-800 p-10 text-white shadow">
                  <input type="file" onChange={handleFileChange} />
                  <button
                      className="rounded bg-green-500 p-2 shadow"
                      onClick={handleUpload}>
                      Upload
                  </button>
                  {upload && (
                      <>
                          <button
                              className="rounded bg-red-500 p-2 shadow"
                              onClick={handleCancel}>
                              Cancel
                          </button>
                          <ProgressBar value={progress} />
                      </>
                  )}
              </form>
          </main>
      </div>
  );
}
