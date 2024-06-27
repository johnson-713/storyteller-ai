import StoryWriter from "@/components/StoryWriter";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="bg-purple-500 flex flex-col space-y-5 justify-center items-center order-1 lg:-order-1 pb-[20px]">
          <Image src={"/images/hat.png"} alt="hat-logo" width={200} height={200} />
          <Button asChild className="px-20 bg-purple-700 text-xl py-8">
            <Link href='/stories'>Explore Story Library</Link>
          </Button>
        </div>
        <StoryWriter />
      </section>


    </main>
  );
}
