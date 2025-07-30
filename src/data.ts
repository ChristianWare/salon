import Img1 from "../public/images/blowout.jpg";
import Img2 from "../public/images/groom.jpg";
import Img3 from "../public/images/spa.jpg";
import Nail from "../public/images/nail.jpg";
import Ear from "../public/images/ear.jpg";
import Teeth from "../public/images/teeth.jpg";
import Flea from "../public/images/flea.jpg";
import Deshedding from "../public/images/deshedding.jpg";
import Cut from "../public/images/cut.jpg";
import Massage from "../public/images/massage.jpg";
import Hydrotherapy from "../public/images/water.jpg";
import Old from "../public/images/old.jpg";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const services = [
  {
    id: 1,
    title: "Bath  Blowout",
    slug: slugify("Bath  Blowout"),
    price: "From $50",
    copy: "A refreshing bath and blowout for your pet.",
    description:
      "Our Bath Blowout service provides your pet with a thorough cleansing using gentle, pet-safe shampoos. After the bath, we use professional dryers to give your pet a soft, fluffy finish. This service helps remove dirt, loose hair, and odors, leaving your pet looking and feeling fresh. It's ideal for pets who need a quick refresh between full grooming appointments.",
    features: [
      {
        id: 1.1,
        title: "Gentle Shampoo",
        details: "We use hypoallergenic, pet-safe shampoos to ensure a deep clean without irritation.",
      },
      {
        id: 1.2,
        title: "Professional Blowout",
        details: "High-velocity dryers fluff and dry your pet's coat for a smooth, soft finish.",
      },
      {
        id: 1.3,
        title: "Odor Removal",
        details: "Removes dirt and odors, leaving your pet smelling fresh.",
      },
    ],
    src: Img1,
    src2: Img1,
  },
  {
    id: 2,
    title: "Full Grooming",
    slug: slugify("Full Grooming"),
    price: "From $75",
    copy: "Complete grooming service including bath, cut, and styling.",
    description:
      "Our Full Grooming package covers every aspect of your pet’s hygiene and appearance. It includes a bath, haircut, nail trim, ear cleaning, and styling tailored to your pet’s breed and preferences. Our experienced groomers ensure your pet is comfortable throughout the process. This service is perfect for maintaining your pet’s health and keeping them looking their best.",
    features: [
      {
        id: 2.1,
        title: "Breed-Specific Styling",
        details: "Haircuts and styling are customized to your pet’s breed and your preferences.",
      },
      {
        id: 2.2,
        title: "Comprehensive Hygiene",
        details: "Includes nail trimming, ear cleaning, and sanitary trim for complete care.",
      },
      {
        id: 2.3,
        title: "Comfort-Focused",
        details: "Our groomers use gentle techniques to keep pets relaxed and happy.",
      },
    ],
    src: Img2,
    src2: Img2,
  },
  {
    id: 3,
    title: "Spa Add-Ons",
    slug: slugify("Spa Add-Ons"),
    price: "From $125",
    copy: "Pamper your pet with our luxurious spa add-ons.",
    description:
      "Enhance your pet’s grooming experience with our Spa Add-Ons. Choose from a variety of treatments such as deep conditioning, aromatherapy, and paw balm application. These extras are designed to nourish your pet’s skin and coat while providing relaxation. Spa Add-Ons are perfect for pets who deserve a little extra pampering.",
    features: [
      {
        id: 3.1,
        title: "Deep Conditioning",
        details: "Special treatments to hydrate and strengthen your pet’s coat.",
      },
      {
        id: 3.2,
        title: "Aromatherapy",
        details: "Calming scents help reduce stress and create a soothing environment.",
      },
      {
        id: 3.3,
        title: "Paw Balm Application",
        details: "Protects and moisturizes your pet’s paws for added comfort.",
      },
    ],
    src: Img3,
    src2: Img3,
  },
  {
    id: 4,
    title: "Nail Trimming",
    slug: slugify("Nail Trimming"),
    price: "From $20",
    copy: "Keep your pet's nails trimmed and healthy.",
    description:
      "Our Nail Trimming service ensures your pet’s nails are kept at a safe and comfortable length. Regular trims prevent painful splitting and reduce the risk of injury. We use specialized tools and gentle handling to minimize stress. This service is essential for your pet’s overall health and mobility.",
    features: [
      {
        id: 4.1,
        title: "Safe Nail Clipping",
        details: "Professional tools and techniques for precise, safe nail trims.",
      },
      {
        id: 4.2,
        title: "Stress-Free Experience",
        details: "Gentle handling to keep your pet calm during the process.",
      },
      {
        id: 4.3,
        title: "Quick Appointments",
        details: "Efficient service for minimal disruption to your pet’s routine.",
      },
    ],
    src: Nail,
    src2: Nail,
  },
  {
    id: 5,
    title: "Ear Cleaning",
    slug: slugify("Ear Cleaning"),
    price: "From $15",
    copy: "Keep your pet's ears clean and free of debris.",
    description:
      "Our Ear Cleaning service removes wax, dirt, and debris from your pet’s ears to prevent infections and discomfort. We use gentle, pet-safe solutions and techniques to ensure a thorough clean. Regular ear care is important for pets prone to ear issues. This service helps maintain your pet’s ear health and comfort.",
    features: [
      {
        id: 5.1,
        title: "Gentle Cleaning Solutions",
        details: "Non-irritating products are used to clean your pet’s ears safely.",
      },
      {
        id: 5.2,
        title: "Infection Prevention",
        details: "Removes buildup that can lead to ear infections and discomfort.",
      },
      {
        id: 5.3,
        title: "Routine Maintenance",
        details: "Recommended for pets with floppy ears or frequent ear issues.",
      },
    ],
    src: Ear,
    src2: Ear,
  },
  {
    id: 6,
    title: "Teeth Brushing",
    slug: slugify("Teeth Brushing"),
    price: "From $30",
    copy:
      "Maintain your pet's dental hygiene with our teeth brushing service.",
    description:
      "Our Teeth Brushing service helps maintain your pet’s oral health by removing plaque and freshening breath. We use pet-safe toothpaste and brushes designed for comfort and effectiveness. Regular dental care can prevent gum disease and other health issues. This service is a simple way to keep your pet’s smile bright and healthy.",
    features: [
      {
        id: 6.1,
        title: "Plaque Removal",
        details: "Removes buildup to prevent dental disease and bad breath.",
      },
      {
        id: 6.2,
        title: "Pet-Safe Products",
        details: "Toothpaste and brushes are formulated for pets’ safety and comfort.",
      },
      {
        id: 6.3,
        title: "Oral Health Education",
        details: "Advice on maintaining your pet’s dental hygiene at home.",
      },
    ],
    src: Teeth,
    src2: Teeth,
  },
  {
    id: 7,
    title: "Flea Treatment",
    slug: slugify("Flea Treatment"),
    price: "From $40",
    copy: "Effective flea treatment to keep your pet comfortable.",
    description:
      "Our Flea Treatment service targets and eliminates fleas from your pet’s coat using safe, effective products. We also provide advice on preventing future infestations. This service helps relieve itching and discomfort, ensuring your pet is happy and healthy. Regular flea control is essential for pets who spend time outdoors.",
    features: [
      {
        id: 7.1,
        title: "Fast-Acting Solutions",
        details: "Products work quickly to eliminate fleas and soothe your pet’s skin.",
      },
      {
        id: 7.2,
        title: "Preventative Advice",
        details: "Guidance on keeping your pet flea-free after treatment.",
      },
      {
        id: 7.3,
        title: "Safe for All Pets",
        details: "Treatments are chosen based on your pet’s age and health.",
      },
    ],
    src: Flea,
    src2: Flea,
  },
  {
    id: 8,
    title: "De-shedding",
    slug: slugify("De-shedding"),
    price: "From $60",
    copy: "Reduce shedding with our specialized de-shedding service.",
    description:
      "Our De-shedding service uses specialized tools and techniques to remove loose hair from your pet’s undercoat. This reduces shedding around your home and keeps your pet’s coat healthy. Regular de-shedding can also help prevent matting and skin issues. It’s ideal for breeds with thick or double coats.",
    features: [
      {
        id: 8.1,
        title: "Undercoat Removal",
        details: "Special tools reach deep to remove loose hair from the undercoat.",
      },
      {
        id: 8.2,
        title: "Mat Prevention",
        details: "Reduces the risk of tangles and mats forming in your pet’s fur.",
      },
      {
        id: 8.3,
        title: "Healthier Coat",
        details: "Promotes a shiny, healthy coat and reduces allergens.",
      },
    ],
    src: Deshedding,
    src2: Deshedding,
  },
  {
    id: 9,
    title: "Specialty Cuts",
    slug: slugify("Specialty Cuts"),
    price: "From $80",
    copy: "Custom grooming cuts tailored to your pet's needs.",
    description:
      "Our Specialty Cuts service offers custom grooming styles for your pet, from breed-specific trims to creative designs. Our groomers consult with you to achieve the look you want while ensuring your pet’s comfort. Specialty cuts can help manage coat length and highlight your pet’s personality. This service is perfect for pets who need a unique or functional style.",
    features: [
      {
        id: 9.1,
        title: "Custom Styling",
        details: "Work with our groomers to choose the perfect cut for your pet.",
      },
      {
        id: 9.2,
        title: "Creative Designs",
        details: "Options for fun, creative trims and patterns.",
      },
      {
        id: 9.3,
        title: "Comfort and Safety",
        details: "Cuts are designed to be comfortable and safe for your pet.",
      },
    ],
    src: Cut,
    src2: Cut,
  },
  {
    id: 10,
    title: "Pet Massage",
    slug: slugify("Pet Massage"),
    price: "From $70",
    copy: "Relax your pet with a soothing massage.",
    description:
      "Our Pet Massage service helps your pet relax and unwind, reducing stress and muscle tension. Gentle techniques are used to improve circulation and flexibility. Massage can be especially beneficial for older pets or those recovering from injury. Give your pet the gift of relaxation and improved well-being.",
    features: [
      {
        id: 10.1,
        title: "Stress Relief",
        details: "Massage techniques help calm anxious or nervous pets.",
      },
      {
        id: 10.2,
        title: "Improved Circulation",
        details: "Gentle pressure increases blood flow and promotes healing.",
      },
      {
        id: 10.3,
        title: "Flexibility Support",
        details: "Helps maintain joint flexibility and muscle tone.",
      },
    ],
    src: Massage,
    src2: Massage,
  },
  {
    id: 11,
    title: "Hydrotherapy",
    slug: slugify("Hydrotherapy"),
    price: "From $90",
    copy:
      "Therapeutic water treatment for your pet's joints and muscles.",
    description:
      "Our Hydrotherapy service uses water-based exercises to support your pet’s joint and muscle health. It’s ideal for pets recovering from surgery, injury, or those with arthritis. Hydrotherapy is low-impact and helps improve mobility, strength, and overall well-being. Our trained staff ensure your pet’s safety and comfort throughout the session.",
    features: [
      {
        id: 11.1,
        title: "Low-Impact Exercise",
        details: "Water-based activities reduce strain on joints and muscles.",
      },
      {
        id: 11.2,
        title: "Rehabilitation Support",
        details: "Ideal for pets recovering from injury or surgery.",
      },
      {
        id: 11.3,
        title: "Arthritis Relief",
        details: "Helps manage pain and improve mobility for older pets.",
      },
    ],
    src: Hydrotherapy,
    src2: Hydrotherapy,
  },
  {
    id: 12,
    title: "Senior Pet Care",
    slug: slugify("Senior Pet Care"),
    price: "From $100",
    copy:
      "Specialized care for older pets to ensure their comfort and well-being.",
    description:
      "Our Senior Pet Care service is tailored to the unique needs of aging pets. We provide gentle grooming, health checks, and comfort-focused treatments to support their well-being. Our staff are trained to handle senior pets with extra care and patience. This service helps older pets stay comfortable, clean, and happy in their golden years.",
    features: [
      {
        id: 12.1,
        title: "Gentle Grooming",
        details: "Extra care is taken to ensure comfort for sensitive senior pets.",
      },
      {
        id: 12.2,
        title: "Health Monitoring",
        details: "Basic health checks are performed during grooming sessions.",
      },
      {
        id: 12.3,
        title: "Mobility Assistance",
        details: "Support for pets with limited mobility or special needs.",
      },
    ],
    src: Old,
    src2: Old,
  },
] as const;
